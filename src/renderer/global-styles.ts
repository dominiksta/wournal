import { style } from "@mvuijs/core";
import * as ui5 from "@mvuijs/ui5";
import "./icons";

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

export const customScrollbar: { [selector: string]: style.MvuiCSSDeclarations } = {
  '*::-webkit-scrollbar': {
    // background: ui5.Theme.ScrollBar_TrackColor,
    background: 'transparent',
    // width: ui5.Theme.ScrollBar_Dimension,
    // height: ui5.Theme.ScrollBar_Dimension,
    width: '8px',
    height: '8px',
  },
  '*::-webkit-scrollbar-thumb': {
    background: theme.scrollbar,
    borderRadius: '10px',
  },
  '*::-webkit-scrollbar-thumb:hover': {
    background: theme.scrollbarHover,
  },
  '*::-webkit-scrollbar-corner': {
    // background: ui5.Theme.ScrollBar_TrackColor,
    background: 'transparent',
  },
}

style.util.applySheetAsStyleTag(document.body, style.sheet({
  'body, html': {
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
  '::highlight(search)': {
    backgroundColor: 'yellow',
    color: 'transparent',
  },
  '::highlight(search-current)': {
    backgroundColor: 'orange',
    color: 'transparent',
  },
  ...customScrollbar,
}), 'global-styles');
