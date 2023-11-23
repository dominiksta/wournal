import { rx } from "@mvui/core";

export type GlobalCommand = {
  human_name: string,
  func: () => any,
  shortcut?: string,
}

export const GlobalCommandId = [
  'file_new',
  'file_save',
  'file_load',

  'history_undo',
  'history_redo',

  'selection_or_clipboard_paste',
  'selection_cut',
  'selection_copy',
  'selection_delete',

  'zoom_in',
  'zoom_reset',
  'zoom_out',

  'preferences_open',

  'tool_pen',
  'tool_eraser',
  'tool_rectangle',
  'tool_select_rectangle',
  'tool_text',
  'tool_stroke_width_fine',
  'tool_stroke_width_medium',
  'tool_stroke_width_thick',

  'scroll_page_next',
  'scroll_page_previous',
  'scroll_page_focus_goto',
  'scroll_page_last',
  'scroll_page_first',

  // 'layer_new',
  // 'layer_current_delete',
  // 'layer_current_move_up',
  // 'layer_current_move_down',
  // 'layer_current_toggle_visbility',

] as const;

export type GlobalCommandIdT = typeof GlobalCommandId[number];

export const GlobalCommandsCtx =
  new rx.Context<{ [P in GlobalCommandIdT]: GlobalCommand }>();
