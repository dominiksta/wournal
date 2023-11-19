import { Component, h, http, rx, style, TemplateElementChild } from "@mvui/core";
import * as ui5 from "@mvui/ui5";
import { theme } from "global-styles";

@Component.register
export class ToolbarButton extends Component<{
  events: {
    click: MouseEvent,
  }
}> {
  props = {
    /** the image to display in the button */
    img: rx.prop<string>(),
    /** tooltip and accessibility */
    alt: rx.prop<string>(),
    /** mark/style as currently active */
    current: rx.prop<boolean>({ defaultValue: false }),
    /** mark/style as currently not applicable */
    disabled: rx.prop<boolean>({ defaultValue: false }),
    /** width of button */
    width: rx.prop<string>({ optional: true }),
  }

  render() {
    const p = this.props;

    const imgOrColor = p.img.pipe(
      rx.switchMap<string, TemplateElementChild>(img => {
        if (img.startsWith('color:'))
          return rx.of(h.span({
            fields: { className: 'colorbtn' },
            style: { background: img.split('color:')[1] }
          }));

        if (img.startsWith('icon:'))
          return rx.of(ui5.icon({
            fields: { name: img.split('icon:')[1] },
          }));

        return http.get(img, { parseBody: false }).map(res => {
          let outerSvg = document.createElementNS(
            "http://www.w3.org/2000/svg", "svg"
          );
          outerSvg.innerHTML = res.body;
          return outerSvg;
        })
      }),
    )

    return [
      h.button({
        fields: {
          className: p.current.derive(c => c ? 'current' : ''),
          disabled: p.disabled,
          title: p.alt,
        },
        style: { width: p.width },
      },
        imgOrColor
      )
    ]
  }

  static styles = style.sheet({
    'button': {
      background: ui5.Theme.Button_Background,
      margin: '0px',
      border: 'none',
      verticalAlign: 'middle',
      height: '36px',
      width: '36px',
      borderRadius: '5px',
    },
    'button:hover': {
      background: ui5.Theme.Button_Hover_Background,
      border: `1px solid ${ui5.Theme.Button_BorderColor}`,
    },
    'button:active:not(:disabled)': {
      background: ui5.Theme.Button_Active_Background,
    },
    'button:disabled': {
      opacity: '0.4',
    },
    'button:active': {
      border: `2px solid ${ui5.Theme.Button_BorderColor}`,
    },
    'button:first-child': {
      marginLeft: '3px',
    },
    'button.current': {
      border: `1px solid ${ui5.Theme.Button_BorderColor}`,
      background: ui5.Theme.Button_Active_Background,
    },
    'button > .colorbtn': {
      display: 'inline-block',
      height: '18px',
      width: '18px',
      border: `1px solid ${ui5.Theme.Button_BorderColor}`,
      filter: theme.invert,
      textAlign: 'center',
    },
    'button > img': {
      textAlign: 'center',
      // center the img even if the containing element is too small for
      // it. see https://stackoverflow.com/questions/1344169/
      margin: '0 -999% 0 -999%',
      filter: theme.invert,
    },
    'button > ui5-icon': {
      color: ui5.Theme.TextColor,
    }
  })
}

@Component.register
export class ToolbarSeperator extends Component {
  render() {
    return [h.span()]
  }

  static styles = style.sheet({
    'span': {
      width: '2px',
      borderLeft: `1px solid ${ui5.Theme.Button_BorderColor}`,
      margin: '0px 1px 0px 3px',
      height: '35px',
      display: 'inline-block',
      verticalAlign: 'middle',
    }
  })
}

@Component.register
export default class Toolbar extends Component {
  render() {
    return [
      h.div({ fields: { className: 'wrapper' } }, [
        h.div({ fields: { className: 'toolbar' } }, [
          h.slot()
        ])
      ])
    ]
  }

  static styles = style.sheet({
    '.wrapper': {
      overflow: 'hidden',
    },
    '.toolbar': {
      width: '9999px',
      background: ui5.Theme.Button_Background,
      borderBottom: `1px solid ${ui5.Theme.Button_BorderColor}`,
      padding: '3px',
    }
  })
}
