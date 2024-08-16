import { rx, h, Component, style, TemplateElementChild } from '@mvuijs/core';
import * as ui5 from '@mvuijs/ui5';
import { debounce } from 'lodash';

@Component.register
class TabButton extends Component<{
  events: {
    close: CustomEvent<string>,
    select: CustomEvent<string>,
  },
  slots: { 'default': HTMLElement }
}> {
  props = {
    id: rx.prop<string>(),
    title: rx.prop<string>(),
    active: rx.prop<boolean>(),
  }

  render() {
    const { title, id, active } = this.props;

    return [
      h.div(
        {
          fields: { id: 'container' },
          classes: { active },
          events: { click: _ => this.dispatch('select', id.value) }
        },
        [
          h.span({
            classes: { active },
            fields: { id: 'title' },
          }, title),
          ui5.icon({
            fields: { id: 'close', design: 'Neutral', name: 'decline' },
            events: {
              click: e => {
                e.stopPropagation();
                this.dispatch('close', id.value);
              }
            }
          }),
        ]
      )
    ]
  }

  static styles = style.sheet({
    ':host': {
      display: 'inline-block',
      margin: '.2em',
      fontFamily: ui5.Theme.FontFamily,
      cursor: 'default',
      width: '10em',
      padding: '.3em',
    },
    '#container': {
      width: '100%',
      padding: '.3em',
      display: 'flex',
      alignItems: 'center',
      height: '1.5em',
    },
    '#container.active': {
      borderBottom: `2px solid ${ui5.Theme.Button_Active_BorderColor}`,
      marginBottom: '-2px',
    },
    '#close': {
      display: 'none',
      marginLeft: '.3em',
    },
    '#container.active:hover > #close': {
      display: 'unset',
    },
    '#title': {
      marginLeft: '.2em',
      flexGrow: '1',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
    },
    '#title, #close': {
      border: 'none',
      color: 'black',
      background: 'none',
    },
    '#title.active': {
      color: ui5.Theme.Button_TextColor,
    },
    '#close:hover, #close:active': {
      color: 'red',
    }
  })
}

export type TabDef = {
  title: string,
  id: string,
  template: TemplateElementChild,
}

@Component.register
export class TabBar extends Component<{
  events: {
    close: CustomEvent<string>,
  }
}> {
  props = {
    tabs: rx.prop<TabDef[]>(),
  }

  render() {
    const { tabs } = this.props;
    const activeTab = new rx.State<string | false>(false);
    const lastClosed = new rx.State<number>(0);

    // select tab 0 if no other is selected. disable tab display if
    // there are no longer any tabs
    this.subscribe(tabs, tabs => {
      if (tabs.find(t => t.id === activeTab.value) !== undefined) return;
      if (tabs.length === 0) activeTab.next(false);
      else {
        if (lastClosed.value > 1)
          activeTab.next(tabs[lastClosed.value-1].id);
        else
          activeTab.next(tabs[0].id);
      }
    });

    const overflowingTabs = new rx.State<string[]>([]);

    const updateOverflow = async () => {
      const tabs = await this.queryAll<TabButton>(TabButton.tagName, false);
      const container = await this.query('#tabs-scroll-container');
      const ct = container.getBoundingClientRect();
      if (tabs === null) overflowingTabs.next([]);
      overflowingTabs.next(Array.from(tabs)
        .filter(tab => {
          const rt = tab.getBoundingClientRect();
          return (rt.left < ct.left) || (rt.right > ct.right);
        })
        .map(tab => tab.props.id.value)
      );
    };
    updateOverflow();

    const fromResized = (el: HTMLElement) =>
      new rx.Stream<ResizeObserverEntry[]>(obs => {
        const resObs = new ResizeObserver(entries => obs.next(entries));
        resObs.observe(el);
        return () => resObs.disconnect();
      });

    this.onRendered(async () => {
      const target = await this.query('#tabs-scroll-container');
      this.subscribe(fromResized(target).pipe(
        rx.debounceTime(100),
        rx.tap(_ => updateOverflow()),
      ))
    });
    this.subscribe(tabs, _ => updateOverflow());

    return [
      h.div(
        { fields: { id: 'tabbar' } },
        [
          h.div(
            {
              fields: { id: 'tabs-scroll-container' },
              events: {
                scroll: debounce(_ => {
                  updateOverflow();
                }, 100),
              }
            },
            h.div(
              { fields: { id: 'tabs' } },
              tabs.derive(tabs => tabs.map(t => TabButton.t({
                props: {
                  id: t.id, title: t.title,
                  active: activeTab.derive(at => at === t.id)
                },
                events: {
                  select: ({ detail }) => activeTab.next(detail),
                  close: ({ detail }) => {
                    lastClosed.next(tabs.findIndex(t => t.id === detail));
                    this.dispatch('close', detail);
                  },
                }
              }))),
            ),
          ),
          ui5.button({
            fields: {
              hidden: overflowingTabs.derive(ot => ot.length === 0),
              id: 'btn-more', icon: 'navigation-down-arrow',
            },
            events: {
              click: async _ => {
                const pop = await this.query<ui5.types.Popover>('#popover-more');
                pop.open = !pop.open;
              }
            },
          }, 'More'),
          ui5.responsivePopover({
            fields: {
              id: 'popover-more',
              placementType: 'Bottom',
              opener: 'btn-more',
              initialFocus: activeTab,
            }
          }, ui5.list(
            tabs.derive(ots => ots.map(t => ui5.li({
              fields: {
                id: t.id,
                'icon': activeTab
                  .derive(at => at === t.id)
                  .ifelse({ if: 'accept', else: '' }),
                iconEnd: true,
              } as any,
              events: {
                click: async _ => {
                  const pop = await this.query<ui5.types.Popover>('#popover-more');
                  pop.open = false;
                  const tabEls = await this.queryAll<TabButton>(TabButton.tagName);
                  const scrollToEl =
                    Array.from(tabEls).find(el => el.props.id.value === t.id);
                  scrollToEl.scrollIntoView();
                  activeTab.next(t.id);
                }
              }
            }, t.title)))
          )),
        ]
      ),
      h.div(
        { fields: { id: 'tab-content' } },
        activeTab.derive(
          at => at === false
            ? '<No tab selected or no content>'
            : tabs.value.find(t => at === t.id).template
        ),
      )
    ]
  }

  static styles = style.sheet({
    ':host': {
      display: 'block',
    },
    '#tabbar': {
      display: 'flex',
      alignItems: 'center',
    },
    '#btn-more': {
      borderRadius: '0.75em',
      width: '6em',
    },
    '#tabs-scroll-container': {
      width: '100%',
      overflowY: 'hidden',
      overflowX: 'scroll',
    },
    '#tabs-scroll-container::-webkit-scrollbar': {
      display: 'none',
    },
    '#tabs': {
      width: 'max-content',
      height: '100%',
    }
  })
}
