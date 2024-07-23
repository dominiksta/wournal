import { Component, h, rx, style } from "@mvuijs/core";
import * as ui5 from '@mvuijs/ui5';

@Component.register
export default class CanvasSelectionButtons extends Component {

  constructor(
    private onCut: () => void,
    private onCopy: () => void,
    private onDelete: () => void,
  ) {
    super();

    this.subscribe(rx.fromEvent(this, 'mousedown'), e => {
      // prevent initiating tool mouse actions
      e.stopPropagation();
    });
  }

  render() {
    return [
      h.div([
        ui5.button(
          {
            fields: { design: 'Transparent', icon: 'scissors', title: 'Cut' },
            events: { click: this.onCut }
          },
          // 'Cut'
        ),
        ui5.button(
          {
            fields: { design: 'Transparent', icon: 'copy', title: 'Copy' },
            events: { click: this.onCopy },
          },
          // 'Copy'
        ),
        ui5.button(
          {
            fields: { design: 'Transparent', icon: 'delete', title: 'Delete' },
            events: { click: this.onDelete }
          },
          // 'Delete'
        ),
      ])
    ]
  }

  static styles = style.sheet({
    ':host': {
      backgroundColor: ui5.Theme.Button_Background,
      borderRadius: ui5.Theme.Button_BorderCornerRadius,
      borderColor: ui5.Theme.Button_BorderColor,
      borderWidth: ui5.Theme.Button_BorderWidth,
      borderStyle: 'solid',
    },
  })

}
