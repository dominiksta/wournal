import { style } from "@mvui/core";
import "./icons";

style.util.applySheetAsStyleTag(document.body, style.sheet({
  'body': {
    margin: '0px',
    width: '100vw',
    height: '100vh',
  },
  'html': {
    overflow: 'hidden',
  }
}), 'global-styles');

type WournalTheme = {
  background: string,
  color: string,
  invert: string,
}

export const lightTheme: WournalTheme = {
  background: '#F5F6F7',
  color: 'black',
  invert: ''
}

export const darkTheme: WournalTheme = {
  background: '#12171C',
  color: 'white',
  invert: 'invert(1)',
}

export const theme = style.themeVariables('wournal', lightTheme);
