import { Component, rx, h, style } from '@mvuijs/core';
import * as ui5 from '@mvuijs/ui5';
import { theme } from 'global-styles';

@Component.register
export default class WournalPDFPageViewContextMenu extends Component {
  private lastMousePos: { x: number, y: number } = { x: 0, y: 0 };
  private lastSelection = '';
  private lastSelectionDim: DOMRect[] = [];

  private shown = new rx.State(false, 'shown');

  public events = new rx.MulticastStream<
    { mouse: { x: number, y: number } } &
    (
      {
        type: 'highlight' | 'strikethrough' | 'underline',
        data: { text: string, dim: DOMRect[] }
      }
      |
      {
        type: 'copy', data: string
      }
    )
  >();

  static styles = style.sheet({
    ':host': {
      position: 'absolute',
      zIndex: '10',
    },
    '#main': {
      background: ui5.Theme.Button_Background,
      border: (
        ui5.Theme.Button_BorderWidth + ' solid ' +
        ui5.Theme.Button_BorderColor
      ),
      borderRadius: ui5.Theme.Button_BorderCornerRadius,
    },
    '#main > ui5-button': {
      display: 'block',
    },
    'ui5-button::part(button)': {
      justifyContent: 'left',
    }
  });

  render() {
    // hide on click outside
    this.subscribe(rx.fromEvent(document.body, 'click'), e => {
      if (e.target instanceof HTMLElement && !e.target.contains(this))
        this.shown.next(false);
    });

    const hide = () => {
      this.shown.next(false);
      document.getSelection().removeAllRanges();
    }

    const annotate = (type: 'highlight' | 'underline' | 'strikethrough') => {
      this.events.next({
        mouse: this.lastMousePos,
        type,
        data: { dim: this.lastSelectionDim, text: this.lastSelection },
      });
      hide();
    };

    return [
      h.div({
        fields: { id: 'main' },
        style: { display: this.shown.ifelse({ if: 'block', else: 'none' }) },
      }, [
        ui5.button({
          fields: { icon: 'copy', id: 'copy', design: 'Transparent' },
          events: {
            click: e => {
              this.events.next({ mouse: e, type: 'copy', data: this.lastSelection });
              hide();
            }
          }
        }, 'Copy'),
        ui5.button({
          fields: { icon: 'wournal/highlighter', id: 'highlight', design: 'Transparent' },
          events: { click: _ => annotate('highlight') },
        }, 'Highlight'),
        ui5.button({
          fields: { icon: 'underline-text', id: 'underline', design: 'Transparent' },
          events: { click: _ => annotate('underline') },
        }, 'Underline'),
        ui5.button({
          fields: { icon: 'strikethrough', id: 'strikethrough', design: 'Transparent' },
          events: { click: _ => annotate('strikethrough') },
        }, 'Strikethrough'),
      ])
    ]
  }

  show(point: {x: number, y: number}, sel: Selection) {
    if (sel.rangeCount === 0 || sel.toString() === '') return;
    this.lastSelection = sel.toString();
    this.lastSelectionDim = Array.from(sel.getRangeAt(0).getClientRects());
    this.lastMousePos = point;

    this.style.left = `${point.x}px`;
    this.style.top = `${point.y}px`;
    this.shown.next(true);
  }
}
