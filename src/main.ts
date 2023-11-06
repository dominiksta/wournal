import { Component, h } from '@mvui/core';
import TopBars from 'app/topbars';
import { Wournal } from 'document/Wournal';

@Component.register
class AppNew extends Component {
  static useShadow = false;

  private wournal = new Wournal(document.createElement('div'), 'browser');

  constructor() {
    super();
    this.wournal.init();
  }

  render() {
    return [
        TopBars.t({ props: { wournal: this.wournal } }),
        h.div(this.wournal.display),
    ]
  }
}

document.body.appendChild(new AppNew());
