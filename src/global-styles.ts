import { style } from "@mvui/core";
import * as ui5 from "@mvui/ui5";
import "./icons";

style.util.applySheetAsStyleTag(document.body, style.sheet({
  'body': {
    margin: '0px',
    width: '100vw',
    height: '100vh',
  },
  'html': {
    overflow: 'hidden',
  },
  ':root': {
    fontFamily: ui5.Theme.FontFamily,
    color: ui5.Theme.TextColor,
    background: ui5.Theme.BackgroundColor,
  },
}), 'global-styles');

type WournalTheme = {
  documentBackground: string,
  documentActive: string,
  scrollbar: string,
  scrollbarHover: string,
  invert: string,
}

export const lightTheme: WournalTheme = {
  scrollbar: '#888888',
  scrollbarHover: '#666666',
  documentBackground: '#a1a1a1',
  documentActive: '#666666',
  invert: ''
}

export const darkTheme: WournalTheme = {
  scrollbar: '#555555',
  scrollbarHover: '#777777',
  documentBackground: '#191B1D',
  documentActive: '#888888',
  invert: 'invert(1)',
}

export const theme = style.themeVariables('wournal', lightTheme);
