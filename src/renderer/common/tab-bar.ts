import { rx, h, Component, style, TemplateElementChild } from '@mvuijs/core';
import * as ui5 from '@mvuijs/ui5';
import { debounce } from 'lodash';

const TAB_WIDTH = '12em';
const DROP_INDICATOR_WIDTH = '.2em';

// [dominiksta:2024-08-17]: This feels like a dirty hack but it *sort of*
// isn't. If we assume the user does not have two mice plugged in or uses two
// fingers simultaneously to drag something around, having this as a global
// works. For some reason a context didn't work andI don't feel like investigating.
let dragStart: TabButton | false = false;

@Component.register
class TabButton extends Component<{
  events: {
    close: CustomEvent<string>,
    select: CustomEvent<string>,
    dropped: CustomEvent<{ fromId: string, toId: string, pos: 'left' | 'right'}>,
  },
}> {
  props = {
    id: rx.prop<string>(),
    title: rx.prop<string>(),
    active: rx.prop<boolean>(),
  }

  render() {
    const { title, id, active } = this.props;

    const showDrpIndLeft = new rx.State(false);
    const showDrpIndRight = new rx.State(false);

    return [
      h.div(
        {
          fields: { id: 'container' },
          events: {
          }
        },
        [
          h.div({
            fields: { id: 'drop-indicator-left' },
            style: { display: showDrpIndLeft.ifelse(
              { if: 'inline-block', else: 'none' }
            )}
          }),
          h.div(
            {
              fields: { id: 'tab-container', draggable: true },
              classes: { active },
              events: {
                click: _ => this.dispatch('select', id.value),
                dragstart: e => {
                  {
                    dragStart = this;
                    // drag handle
                    const dragImageHide = this.cloneNode(true) as TabButton;
                    dragImageHide.id = "drag-image-hide"
                    dragImageHide.style.opacity = '0';

                    const dragImage = document.createElement('span');
                    dragImage.id = "drag-image";
                    dragImage.style.pointerEvents = 'none';
                    dragImage.textContent = this.props.title.value;
                    dragImage.style.fontFamily = ui5.Theme.FontFamily;
                    dragImage.style.fontSize = ui5.Theme.FontSize;
                    dragImage.style.opacity = '0.5';
                    dragImage.style.position = "absolute";

                    document.body.appendChild(dragImageHide);
                    document.body.appendChild(dragImage);
                    e.dataTransfer.setDragImage(dragImageHide, 0, 0);
                  }
                },
                drag: e => {
                  {
                    // drag handle
                    const dragImage = document.getElementById('drag-image');
                    dragImage.style.left = `${e.x + 10}px`;
                    dragImage.style.top = `${e.y + 10}px`;
                  }
                },
                dragend: e => {
                  {
                    // drag handle
                    const dragImage = document.getElementById('drag-image');
                    const dragImageHide = document.getElementById('drag-image-hide');
                    dragImage?.remove();
                    dragImageHide?.remove();
                  }
                  showDrpIndLeft.next(false); showDrpIndRight.next(false);
                },
                dragover: e => {
                  e.preventDefault();
                  const me = this.getBoundingClientRect();
                  const middle = me.left + me.width / 2;
                  showDrpIndLeft.next(e.x < middle);
                  showDrpIndRight.next(e.x >= middle);
                },
                dragleave: _ => {
                  showDrpIndLeft.next(false); showDrpIndRight.next(false);
                },
                drop: e => {
                  {
                    // drag handle
                    const dragImage = document.getElementById('drag-image');
                    const dragImageHide = document.getElementById('drag-image-hide');
                    dragImage.remove();
                    dragImageHide.remove();
                  }
                  if (dragStart === false) throw new Error('no drag start element');
                  const me = this.getBoundingClientRect();
                  const middle = me.left + me.width / 2;
                  this.dispatch('dropped', {
                    fromId: dragStart.props.id.value, toId: id.value,
                    pos: e.x < middle ? 'left' : 'right'
                  });
                  showDrpIndLeft.next(false); showDrpIndRight.next(false);
                },
              }
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
          ),
          h.div({
            fields: { id: 'drop-indicator-right' },
            style: { display: showDrpIndRight.ifelse(
              { if: 'inline-block', else: 'none' }
            )}
          }),
        ]
      ),
    ]
  }

  static styles = style.sheet({
    // '*': { outline: '1px solid lightgreen' },
    ':host': {
      display: 'inline-block',
      // margin: '.2em',
      fontFamily: ui5.Theme.FontFamily,
      fontSize: ui5.Theme.FontSize,
      cursor: 'default',
      width: TAB_WIDTH,
      // padding: '.3em',
    },
    '#container': {
      display: 'flex',
      alignItems: 'center',
    },
    '#tab-container:hover': {
      background: ui5.Theme.Button_Hover_Background,
    },
    '#tab-container': {
      borderRadius: '.2em',
      flexGrow: '1',
      width: `calc(${TAB_WIDTH} - 3em)`,
      padding: '4px',
      display: 'flex',
      alignItems: 'center',
      height: '1.5em',
    },
    '#tab-container.active': {
      borderBottom: `2px solid ${ui5.Theme.Button_Active_BorderColor}`,
      paddingBottom: '2px',
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
      color: ui5.Theme.TextColor,
      background: 'none',
    },
    '#title.active': {
      color: ui5.Theme.Button_TextColor,
    },
    '#close': {
      display: 'none',
      marginLeft: '.3em',
    },
    '#tab-container.active:hover #title': {
      maxWidth: `calc(${TAB_WIDTH} - 3em)`,
    },
    '#tab-container.active:hover > #close': {
      display: 'inline-block',
    },
    '#close:hover, #close:active': {
      color: 'red',
    },
    '#drop-indicator-left, #drop-indicator-right': {
      display: 'inline-block',
      height: '1.4em',
      width: '0px',
      outline: `${DROP_INDICATOR_WIDTH} solid ${ui5.Theme.Button_TextColor}`,
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
    move: CustomEvent<{ from: number, to: number }>,
  }
}> {
  props = {
    tabs: rx.prop<TabDef[]>(),
    activeTab: rx.prop<string | false>({ defaultValue: false }),
    hidden: rx.prop<boolean>({ defaultValue: false }),
  }

  private tabContentRef = this.ref<HTMLDivElement>();

  public get activeTabContent() {
    return Array.from(this.tabContentRef.current.children)
      .find(c => c.getAttribute('tab-id') === this.props.activeTab.value)
      .children[0];
  }

  render() {
    const { tabs, activeTab, hidden } = this.props;
    const lastClosed = new rx.State<number>(0);

    // select tab 0 if no other is selected. disable tab display if
    // there are no longer any tabs
    this.subscribe(tabs, tabs => {
      if (tabs.find(t => t.id === activeTab.value) !== undefined) return;
      if (tabs.length === 0) activeTab.next(false);
      else {
        if (lastClosed.value > 1 && (lastClosed.value-1) in tabs)
          activeTab.next(tabs[lastClosed.value-1].id);
        else
          activeTab.next(tabs[0].id);
      }
    });

    this.subscribe(activeTab, async at => {
      const tabs = await this.queryAll<TabButton>(TabButton.tagName, false);
      const tabEl = Array.from(tabs).find(tab => tab.props.id.value === at);
      if (tabEl) tabEl.scrollIntoView();
    })

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
    this.subscribe(tabs, _ => {
      requestAnimationFrame(updateOverflow);
    });

    return [
      h.div(
        { fields: { id: 'tabbar', hidden } },
        [
          h.div(
            {
              fields: { id: 'tabs-scroll-container', hidden },
              events: {
                scroll: debounce(_ => {
                  updateOverflow();
                }, 100),
              }
            },
            h.div(
              { fields: { id: 'tabs' } },
              tabs.derive(tabs => tabs.map((t, idx) => TabButton.t({
                props: {
                  id: t.id, title: t.title,
                  active: activeTab.derive(at => at === t.id),
                },
                events: {
                  select: ({ detail }) => activeTab.next(detail),
                  close: ({ detail }) => {
                    lastClosed.next(tabs.findIndex(t => t.id === detail));
                    this.dispatch('close', detail);
                  },
                  dropped: ({ detail }) => {
                    const from = tabs.findIndex(t => t.id === detail.fromId);
                    let to = tabs.findIndex(t => t.id === detail.toId);
                    if (from < to && detail.pos === 'left') to = Math.max(0, to - 1);
                    if (from > to && detail.pos === 'right') to = Math.min(tabs.length, to + 1);
                    if (from === to) return;
                    this.dispatch('move', { from, to });
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
                  activeTab.next(t.id);
                }
              }
            }, t.title)))
          )),
        ]
      ),
      h.div(
        { fields: { id: 'tab-content' }, ref: this.tabContentRef },
        h.foreach(
          // the reason why we sort these here is because we dont want to
          // re-render anything when the order changes. this is not strictly
          // necessary but a bit nicer for performance.
          tabs.derive(tabs => [...tabs].sort((a, b) => parseInt(a.id) - parseInt(b.id))),
          tabdef => tabdef.id,
          tabdef => h.div({
            attrs: {
              tabId: tabdef.value.id,
              hidden: activeTab.derive(at => at === tabdef.value.id ? undefined : ''),
            },
            style: { height: '100%' }
          }, tabdef.value.template)
        )
      )
    ]
  }

  static styles = style.sheet({
    ':host': {
      display: 'flex',
      flexDirection: 'column',
    },
    '#tabbar': {
      background: ui5.Theme.Button_Background,
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
      display: 'flex',
      width: 'max-content',
      height: '100%',
    },
    '#tab-content': {
      flexShrink: '1',
      overflow: 'auto',
    }
  })
}
