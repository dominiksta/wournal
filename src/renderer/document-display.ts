import { OutlineContainer } from 'app/outline';
import { SearchBox } from 'app/search-box';
import { Component, rx, h, style } from '@mvuijs/core';
import { ApiCtx } from 'app/api-context';
import { getLogger } from 'Shared/logging';
import { WournalDocument } from 'document/WournalDocument';
import { FileUtils } from 'util/FileUtils';
import { BasicDialogManagerContext } from 'common/dialog-manager';
import { customScrollbar, theme } from 'global-styles';
import * as ui5 from '@mvuijs/ui5';

const LOG = getLogger(__filename);

@Component.register
export default class DocumentDisplay extends Component {
  public hideSideBar = new rx.State(true);

  props = {
    doc: rx.prop<WournalDocument>(),
    hideSearchBox: rx.prop<boolean>(),
  }

  private outlineRef = this.ref<OutlineContainer>();
  public get outline() { return this.outlineRef.current }

  private searchBoxRef = this.ref<SearchBox>();
  public get searchBox() { return this.searchBoxRef.current }

  private documentRef = this.ref<HTMLDivElement>();
  public get document() { return this.documentRef.current }

  render() {
    const { doc, hideSearchBox } = this.props;
    const api = this.getContext(ApiCtx);
    const dialog = this.getContext(BasicDialogManagerContext);

    this.subscribe(hideSearchBox, hide => {
      if (!hide) this.searchBoxRef.current.focus();
    });

    // sidebar resizing
    Promise.all([
      this.query('#seperator'), this.query('#sidebar'),
    ]).then(([sep, sideb]) => {
      let oldMouseX = 0;
      sideb.style.minWidth = '200px'; sideb.style.maxWidth = '200px';
      const resize = (e: MouseEvent) => {
        const mouseX =
          Math.max(200, Math.min(e.clientX, this.getBoundingClientRect().width - 50));
        sideb.style.minWidth =
          parseInt(sideb.style.minWidth.split('px')[0]) + mouseX - oldMouseX + 'px';
        sideb.style.maxWidth = sideb.style.minWidth;
        oldMouseX = mouseX;
      }
      const stopListening = () => {
        document.removeEventListener('mousemove', resize);
        document.removeEventListener('mouseup', stopListening);
        this.style.userSelect = 'unset';
      }
      this.subscribe(rx.fromEvent(sep, 'mousedown'), e => {
        oldMouseX = e.clientX;
        this.style.userSelect = 'none';
        document.addEventListener('mousemove', resize);
        document.addEventListener('mouseup', stopListening);
        e.stopPropagation();
      });
    })


    const handleDrop = async (e: DragEvent) => {
      LOG.info('Handling File Drop');
      e.preventDefault();
      for (const item of e.dataTransfer.items) {
        if (item.kind !== 'file') continue;
        const path: string = (item.getAsFile() as any).path
        const ext = FileUtils.fileExtension(path).toLowerCase();
        if (ext !== 'woj' && ext !== 'svg' && ext !== 'pdf') {
          dialog.infoBox(
            `Unsupported File Extension '${ext.toUpperCase()}'`,
            `The file '${path}' has an extension that is not compatible ` +
            `with Wournal.`,
            'Error',
          );
          break;
        }
        if (await api.promptClosingUnsaved()) return;
        api.loadDocument(path);
        break;
      }
    }

    return [
      h.div({
        fields: { id: 'main' },
        events: {
          drop: handleDrop.bind(this),
          dragover: e => e.preventDefault(),
        }
      }, [
        h.div({
          fields: { id: 'sidebar', hidden: this.hideSideBar },
        }, [OutlineContainer.t({ ref: this.outlineRef })]),
        h.div({
          fields: { id: 'seperator', hidden: this.hideSideBar },
        }),
        h.div(
          { fields: { id: 'main-right' } },
          [
            h.div(
              {
                fields: { id: 'search-box', hidden: hideSearchBox },
              },
              SearchBox.t({
                ref: this.searchBoxRef,
                events: {
                  'search-stop': _ => hideSearchBox.next(true),
                }
              }),
            ),
            h.div({
              ref: this.documentRef,
              fields: { id: 'document-wrapper' },
              events: {
                scroll: () => {
                  doc.value.setActivePageForCurrentScroll();
                }
              }
            },
              doc
            )
          ]),
      ]),
    ]
  }

  static styles = style.sheet({
    '#main': {
      display: 'flex',
      height: '100%',
      width: '100%',
    },
    '#seperator': {
      width: '0.7em',
      cursor: 'col-resize',
      borderRadius: '3px',
      backgroundColor: ui5.Theme.BaseColor,
    },
    '#main-right': {
      display: 'flex',
      flexDirection: 'column',
      flexGrow: '1',
      overflowX: 'auto',
      // height: '100%',
    },
    '#document-wrapper': {
      background: theme.documentBackground,
      // height: '100%',
      flexGrow: '1',
      // width: '100%',
      overflowY: 'auto',
    },
    '#document-wrapper > div': {
      overflow: 'auto',
      height: '100%',
      width: '100%',
    },
    ...customScrollbar,
  })
}
