import { Component, h, rx } from '@mvuijs/core';
import { TabBar, TabDef } from 'common/tab-bar';

@Component.register
export class App extends Component {
  render() {
    const counter = new rx.State(0);
    const tabs = new rx.State<TabDef[]>([
      {
        title: 'Tab 1',
        id: 't1',
        template: h.p('Content Tab 1'),
      },
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
