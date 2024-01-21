
export class ShortcutManager {
  private shortcuts = new Map<string, Shortcut>();
  private focusEls: (HTMLElement | Document)[] = [];

  public addShortcut(shortcut: Shortcut): void {
    this.shortcuts.set(shortcut.id, shortcut);
  }

  /** Focus the main shortcut context element. */
  public focus(): void {
    // console.debug('focus shortcuts')
    for (const el of this.focusEls) {
      if (el instanceof HTMLElement) el.focus();
    }
  }

  /** set up shortcut handling */
  public addEl(el: HTMLElement | Document): void {
    this.focusEls.push(el);
    el.addEventListener('keyup', this.eventHandler.bind(this) as any);
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
