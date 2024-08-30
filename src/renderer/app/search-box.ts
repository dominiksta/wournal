import { Component, h, rx, style } from "@mvuijs/core";
import * as ui5 from '@mvuijs/ui5';
import { SearchText } from "document/types";
import _ from "lodash";
import { Highlights } from "util/highlights";
import { ApiCtx } from "./api-context";
import { DocumentCtx } from "./document-context";
import { ToastCtx } from "./toast-context";

@Component.register
export class SearchBox extends Component<{
  events: { 'search-stop': CustomEvent<void> }
}> {

  private inputRef = this.ref<ui5.types.Input>();
  public override async focus() { this.inputRef.current.focus() }

  render() {
    const searchText = new rx.State('');
    const searchIdx = new rx.State<number>(0, 'SearchBox:searchIdx');
    const loading = new rx.State(false, 'SearchBox:loading');
    const active = new rx.State(false, 'SearchBox:active');
    const matchCase = new rx.State(false, 'SearchBox:matchCase');

    const doc = this.getContext(DocumentCtx);
    const api = this.getContext(ApiCtx);
    const toast = this.getContext(ToastCtx);

    this.subscribe(doc.pipe(rx.switchMap(d => d.pages)), () => {
      searchText.next('');
      searchIdx.next(0);
    })

    let activeSearchText: string | false = false;
    const found = new rx.State<SearchText[][]>([], 'SearchBox:found');
    const foundLen = found.derive(
      found => found.map(page => page.length).reduce((a, b) => a + b, 0)
    );

    function startOrContinueSearch(dir: 'forward' | 'backward') {
      active.next(true);
      if (activeSearchText !== searchText.value) startSearch();
      else continueSearch(dir);
    }

    async function startSearch() {
      if (loading.value) return;
      if (searchText.value.length < 2) {
        // perf and edge cases
        toast.open('Searching for a single character is currently not supported');
        return;
      }

      activeSearchText = searchText.value;
      searchIdx.next(0);
      loading.next(true);
      const allText = await Promise.all(doc.value.pages.value.map(p => p.getText()));
      const trim = (s: string) => {
        let ret = s.replaceAll('\n', '').replaceAll('  ', ' ');
        if (!matchCase.value) ret = ret.toLowerCase();
        return ret;
      }
      found.next(allText.map(
        (page, pageI) => {
          let pageText = '';
          let pageIdxs: number[] = [];
          for (let i = 0; i < page.length; i++) {
            pageIdxs.push(pageText.length);
            pageText += page[i].str + ' ';
          }
          pageText = trim(pageText);
          console.assert(!pageIdxs.includes(-1));
          const foundIdxs = allIndexesOf(trim(activeSearchText as string), pageText);
          if (foundIdxs.length === 0) return [];

          const ret: SearchText[] = [];
          for (const idx of foundIdxs) {
            const found = page[nextSmallestIdx(idx, pageIdxs)];
            ret.push(found)
          }
          // if (pageI === 2) LOG.debug({ pageText, pageIdxs, page, foundIdxs, ret });
          return ret;
        }
      ));
      // LOG.debug(found.value);
      loading.next(false);

      if (api.getCurrentPageNr() !== 1)
        searchIdx.next(
          found.value
            .slice(0, api.getCurrentPageNr() - 1)
            .map(p => p.length)
            .reduce((a, b) => a + b)
        );

      Highlights.clear('search');
      highlightAndJump();
    }

    this.subscribe(matchCase.pipe(rx.skip(1)), _ => {
      if (searchText.value.length < 2) return;
      startSearch();
    });

    function highlightAndJump() {
      let foundPage = 0, foundPageOffset = 0;
      {
        let counter = 0;
        outer: for (let pageI = 0; pageI < found.value.length; pageI++) {
          for (let searchI = 0; searchI < found.value[pageI].length; searchI++) {
            if (counter == searchIdx.value) {
              foundPage = pageI;
              foundPageOffset = searchI;
              break outer;
            }
            counter++;
          }
        }
      }

      Highlights.clear('search-current');
      // LOG.debug(
      //   foundPage, foundPageOffset,
      //   found.value[foundPage][foundPageOffset], found.value[foundPage]
      // );

      for (let i = 0; i < found.value.length; i++) {
        doc.value.pages.value[i].highlightText(
          activeSearchText as string,
          i == foundPage ? foundPageOffset : false,
          matchCase.value,
        )
      }

      const page = doc.value.pages.value[foundPage];
      // const elRect = SVGUtils.scaleRect(
      //   found.value[foundPage][foundPageOffset].rect,
      //   doc.value.getZoom()
      // );
      const pageRect = page.display.getBoundingClientRect();
      const docRect = doc.value.getBoundingClientRect();
      const topOfPage = pageRect.top - docRect.top;

      // TODO: scroll to element
      // const topOfEl = topOfPage + elRect.y;
      // LOG.info(found.value[foundPage][foundPageOffset].rect, elRect.y);
      if (foundPage !== api.getCurrentPageNr() - 1) {
        api.jumplistMark();
        api.scrollPos(topOfPage, 0);
      };
    }

    function continueSearch(dir: 'forward' | 'backward') {
      if (!active.value) return;
      if (dir == 'forward')
        searchIdx.next(v => (v + 1) >= foundLen.value ? 0 : v + 1);
      else
        searchIdx.next(v => v <= 0 ? foundLen.value - 1 : v - 1);
      highlightAndJump();
    }

    const stopSearch = () => {
      active.next(false);
      activeSearchText = false;
      searchIdx.next(0); searchText.next('');
      Highlights.clear('search-current');
      Highlights.clear('search');
      for (const page of doc.value.pages.value) page.highlightText('', false);
      this.dispatch('search-stop', undefined);
    }

    return [
      h.div({
        events: {
          click: e => {
            this.focus();
            e.stopPropagation();
          },
          focus: _ => this.focus(),
        }
      }, [
        ui5.input({
          ref: this.inputRef,
          fields: {
            value: rx.bind(searchText),
          },
          events: {
            keyup: e => {
              if (e.key === 'Enter') {
                startOrContinueSearch(e.shiftKey ? 'backward' : 'forward');
              }
              if (e.key === 'Escape') stopSearch();
              if (e.key === 'c' && e.altKey) matchCase.next(v => !v);
              e.stopPropagation();
            }
          }
        }),
        ui5.button({
          fields: {
            icon: 'slim-arrow-left', design: 'Transparent',
            tooltip: 'Find Previous',
          },
          events: { click: _ => continueSearch('backward') }
        }),
        ui5.button({
          fields: {
            icon: 'slim-arrow-right', design: 'Transparent',
            tooltip: 'Find Next',
          },
          events: { click: _ => continueSearch('forward') }
        }),
        ui5.toggleButton({
          fields: {
            icon: 'business-suite/icon-match-case', design: 'Transparent',
            tooltip: 'Match Case (Alt+C)', pressed: matchCase,
          },
          events: { click: _ => matchCase.next(v => !v) },
        }),
        ui5.button({
          fields: {
            icon: 'decline', design: 'Transparent',
            tooltip: 'Stop Search',
          },
          events: { click: _ => stopSearch() }
        }),
        h.span(
          {
            fields: { id: 'progress' },
            style: {
              display: rx.derive(
                active, loading, (a, l) => (a && !l) ? 'inline-block' : 'none',
              ),
              color: foundLen.derive(
                v => v === 0 ? ui5.Theme.Field_WarningColor : 'inherit'
              )
            },
          },
          rx.derive(searchIdx, foundLen, (i, len) => {
            if (len === 0) return '0/0';
            return `${i + 1}/${len}`;
          })
        ),
        h.span(
          { fields: { id: 'loading' } },
          loading.pipe(rx.debounceTime(100)).ifelse({ if: 'Loading...', else: '' })
        ),

      ]),
    ]
  }

  static styles = style.sheet({
    ':host': {
      display: 'block',
      background: ui5.Theme.BackgroundColor,
      textAlign: 'center',
      userSelect: 'none',
    },
    '#progress, #loading': {
      display: 'inline-block',
      fontSize: '11pt',
    }
  });
}


function allIndexesOf(needle: string, haystack: string): number[] {
  let foundIdx = -1;
  const ret = [];

  while (true) {
    foundIdx = haystack.indexOf(needle, foundIdx + 1);
    if (foundIdx === -1) break;
    ret.push(foundIdx);
  }

  return ret;
}

function nextSmallestIdx(needle: number, haystack: number[]): number {
  let ret = -Infinity;
  for (let i = 0; i < haystack.length; i++) {
    if (haystack[i] >= ret && haystack[i] <= needle) ret = i;
  }
  if (ret === -Infinity) ret = -1;
  return ret;
}
