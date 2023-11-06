import { Wournal } from "../document/Wournal";

export const ThemeUtils = {
  /** Return the systems/browsers preferred theme */
  currBrowserTheme: function(): "light" | "dark" {
    // see https://stackoverflow.com/a/57795495
    return (
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
    ) ? "dark" : "light";
  },

  /** Wether the application should currently be displayed in dark mode */
  currDark: function(): boolean {
    return Wournal.CONF.theme === "dark" ||
      (Wournal.CONF.theme === "auto" && ThemeUtils.currBrowserTheme() === "dark");
  },

  /** Register a function to be called on system/browser theme change */
  registerThemeChangeHandler: function(
    fun: ((theme: "light" | "dark") => void)
  ) {
    window.matchMedia('(prefers-color-scheme: dark)')
      .addEventListener('change', event => {
        fun(event.matches ? "dark" : "light");
      });
  }
}
