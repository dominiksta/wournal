import { Component, h } from "@mvui/core";

@Component.register
export class ShortcutManager extends Component {
  private shortcuts = new Map<string, Shortcut>();
  private focusEl = document.createElement('textarea');

  public addShortcut(shortcut: Shortcut): void {
    this.shortcuts.set(shortcut.id, shortcut);
  }

  /** Focus the main shortcut context element. */
  public focus(): void {
    // console.debug('focus');
    this.focusEl.focus();
  }

  render() {
    this.onRendered(async () => {
      this.focusEl = (await this.query('#focus'));
      this.focus();
    })

    return [
      /**
         This is possibly the funniest hack in wournal yet. We want to be able
         to intercept 'paste' events, but not attach a global event listener to
         document.body such that multiple wournal instances may run in the same
         runtime. Not every element emits paste events, but a <textarea> is one
         of them.

         So we construct a textarea here, but of course we do not want to show
         it. However,
       */
      h.textarea({
        style: {
          width: '0px', height: '0px', margin: '0', padding: '0',
          display: 'fixed', position: 'absolute', top: '-1000px',
          left: '-1000px',
        },
        fields: {
          id: 'focus',
          tabIndex: 0,
        },
        events: {
          keydown: this.eventHandler.bind(this),
          paste: this.pasteEventHandler.bind(this),
        } as any
      })
    ]
  }

  /** set up shortcut handling */
  public addEl(el: HTMLElement): void {
    el.addEventListener('mouseup', e => {
      // console.log(document.activeElement.tagName);
      // console.log(((e.target! as HTMLElement).getRootNode() as any).host);
      this.focus();
    });
  }

  private eventHandler(e: KeyboardEvent): void {
    // if (e.target instanceof HTMLInputElement ||
    //   e.target instanceof HTMLTextAreaElement) return;
    for (let [_, shortcut] of this.shortcuts) {
      if (e.key.toLowerCase() === shortcut.key.toLowerCase() &&
        e.shiftKey === shortcut.shift &&
        e.ctrlKey === shortcut.ctrl &&
        e.altKey === shortcut.alt) {
        e.preventDefault();
        shortcut.action();
      }
    }
  }

  public pasteImageHandler = (text: string) => { console.log(text) };
  public pastePlainTextHandler = (text: string) => { console.log(text) };

  private pasteEventHandler(p: ClipboardEvent) {
    // console.log(p.target);
    // I am not sure why or how, but there could be multiple items
    // in the clipbard.
    for (let item of p.clipboardData.items) {
      // console.log(item);
      if (item.kind == 'file' && item.type.match('^image/')) {
        // Note: In my experience all pasted image data seems to
        // be of type image/png, no matter what the original source
        // file was. This could be my image viewer or the
        // browser, I don't know
        let blob = item.getAsFile();
        let reader = new FileReader();
        reader.onload = (event) =>
          this.pasteImageHandler(event.target.result as string);
        reader.readAsDataURL(blob);
      } else if (item.kind == 'string'
        && item.type.match('^text/plain')) {
        // When copying with Ctrl-C in a browser, the text would
        // also be available as text/html.
        item.getAsString(this.pastePlainTextHandler)
      }
    }
  };
}

export class Shortcut {
  /** The human readable unique identifier for this shortcut */
  public id: string;

  constructor(
    public action: () => {},
    public key: string,
    public alt: boolean = false,
    public ctrl: boolean = false,
    public shift: boolean = false
  ) {
    this.id = (ctrl ? 'Ctrl+' : '') +
      (alt ? 'Alt+' : '') +
      (shift ? 'Shift+' : '') + key;
  }

  public static fromId(id: string, action: () => {}) {
    let split = id.split('+');
    const keyIsPlus = id.endsWith('+') || id.endsWith('++');

    return new Shortcut(
      action,
      keyIsPlus ? '+' : split[split.length - 1],
      split.indexOf('Alt') !== -1,
      split.indexOf('Ctrl') !== -1,
      split.indexOf('Shift') !== -1,
    );
  }
}
