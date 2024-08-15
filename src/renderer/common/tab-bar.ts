import { rx, h, Component, style, TemplateElementChild } from '@mvuijs/core';
import * as ui5 from '@mvuijs/ui5';

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
      minWidth: '10em',
      padding: '.3em',
    },
    '#container': {
      // outline: '1px solid gray',
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
    '#container:hover > #close': {
      display: 'unset',
    },
    '#title': {
      marginLeft: '.2em',
      flexGrow: '1',
    },
    '#title, #close': {
      // display: 'block',
      border: 'none',
      color: 'black',
      background: 'none',
      // verticalAlign: 'middle',
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

    // select tab 0 if no other is selected. disable tab display if
    // there are no longer any tabs
    tabs.subscribe(tabs => {
      if (activeTab.value !== false) return;
      if (tabs.length === 0) activeTab.next(false);
      else activeTab.next(tabs[0].id);
    })

    return [
      h.div(
        { fields: { id: 'tab-container' }},
        tabs.derive(tabs => tabs.map(t => TabButton.t({
          props: {
            id: t.id, title: t.title,
            active: activeTab.derive(at => at === t.id)
          },
          events: {
            select: ({ detail }) => activeTab.next(detail),
            close: ({ detail }) => this.dispatch('close', detail),
          }
        })))
      ),
      h.div(
        { fields: { id: 'tab-content' }},
        activeTab.derive(
          at => at === false
            ? '<No tab selected or no content>'
            : tabs.value.find(t => at === t.id).template
        ),
      )
    ]
  }

  static styles = style.sheet({
    '#tab-container > *': {

    }
  })
}
