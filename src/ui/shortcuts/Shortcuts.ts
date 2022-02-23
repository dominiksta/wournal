export class ShortcutManager {
    private static shortcuts = new Map<string, Shortcut>();
    private static el: HTMLElement;

    public static addShortcut(shortcut: Shortcut): void {
        this.shortcuts.set(shortcut.id, shortcut);
    }

    /**
     * Focus the main shortcut context element. This may have to be called
     * manually in some scenarious. If we could be sure that wournal is the only
     * application running in the current tag and that only one instance of
     * wournal is running, we could set the listener to ´document.body´. Since
     * it should be possible to run multiple instances of wournal in the same
     * tab in the future, this will have to do.
     */
    public static focus(): void {
        ShortcutManager.el.focus();
    }

    /** set up shortcut handling */
    public static setup(el: HTMLElement): void {
        ShortcutManager.el = el;
        el.setAttribute("tabindex", "0");
        el.addEventListener("keydown", ShortcutManager.eventHandler);

        ShortcutManager.focus();
    }

    private static eventHandler(e: KeyboardEvent): void {
        // console.log(e);
        for (let [_, shortcut] of ShortcutManager.shortcuts) {
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
        this.id = (ctrl ? "Ctrl+" : "") +
            (alt ? "Alt+" : "") +
            (shift ? "Shift+" : "") + key;
    }

    public static fromId(id: string, action: () => {}) {
        let split = id.split("+");
        const keyIsPlus = id.endsWith("+") || id.endsWith("++");

        return new Shortcut(
            action,
            keyIsPlus ? "+" : split[split.length - 1],
            split.indexOf("Alt") !== -1,
            split.indexOf("Ctrl") !== -1,
            split.indexOf("Shift") !== -1,
        );
    }
}
