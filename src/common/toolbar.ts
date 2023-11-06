import { Component, h, rx, style } from "@mvui/core";

@Component.register
export class ToolbarButton extends Component<{
    events: {
        click: CustomEvent<ToolbarButton>,
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

        const imgOrColor = p.img.derive(
            img => img.startsWith('color:')
                ? h.div({ fields: { className: 'colorbtn' }, style: { background: '' } })
                : h.img({ fields: { src: p.img, alt: p.alt } })
        );

        return [
            h.button({
                fields: {
                    className: p.current.derive(c => c ? 'active' : ''),
                    disabled: p.disabled,
                    title: p.alt,
                },
                style: { width: p.width },
                events: {
                    click: _ => this.dispatch('click', this),
                }
            },
                imgOrColor
            )
        ]
    }

    static styles = style.sheet({
        'button': {
            background: 'white',
            margin: '0px',
            border: 'none',
            verticalAlign: 'middle',
            height: '40px'
        },
        'button:hover': {
            background: '#efefef',
        },
        'button:active:not(:disabled)': {
            background: 'lightblue',
        },
        'button:disabled': {
            opacity: '0.4',
        },
        'button:active': {
            borderBottom: '3px solid lightblue !important',
            borderTop: '3px solid white !important',
        },
        'button:first-child': {
            marginLeft: '3px',
        },
        'button > colorbtn': {
            height: '18px',
            width: '18px',
            border: '1px solid black',
        },
        'button > img': {
            textAlign: 'center',
            // center the img even if the containing element is too small for
            // it. see https://stackoverflow.com/questions/1344169/
            margin: '0 -999% 0 -999%'
        }
    })
}

@Component.register
export class ToolbarSeperator extends Component {
    render() {
        return [ h.span() ]
    }

    static styles = style.sheet({
        'span': {
            width: '2px',
            borderLeft: '2px solid lightgray',
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
            h.div({ fields: { className: 'wrapper' }}, [
                h.div({ fields: { className: 'toolbar' }}, [
                    h.slot()
                ])
            ])
        ]
    }

    static styles = style.sheet({
        'wrapper': {
            overflow: 'hidden',
        },
        'toolbar': {
            width: '9999px',
            background: 'white',
            borderBottom: '1px solid gray',
            color: 'black',
        }
    })
}
