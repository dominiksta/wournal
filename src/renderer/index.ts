import { Component, h, rx } from '@mvuijs/core';
import { TabBar, TabDef } from 'common/tab-bar';

@Component.register
export class App extends Component {
  render() {
    this.setAttribute('data-ui5-compact-size', 'true');

    const counter = new rx.State(0);

    const mkBasicTab = (n: number) => ({
      title: `Tab ${n}`,
      id: `t${n}`,
      template: h.p(`Content Tab ${n}`),
    });

    const tabs = new rx.State<TabDef[]>([
      mkBasicTab(1),
      {
        title: 'Tab 2',
        id: 't2',
        template: h.p([
          h.button(
            { events: { click: _ => counter.next(v => v + 1) }}, 'inc'
          ),
          h.span(counter),
        ]),
      },
      {
        title: 'Tab 3 loooooong name',
        id: 't3',
        template: h.p('Content Tab 3'),
      },
      ...[4, 5, 6, 7].map(mkBasicTab)
    ]);



    return [
      TabBar.t({
        props: { tabs },
        events: {
          close: ({ detail }) => {
            tabs.next(val => val.filter(tab => tab.id !== detail));
          }
        }
      }),
    ]
  }
}

document.querySelector('#root').appendChild(new App());
