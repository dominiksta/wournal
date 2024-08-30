import { rx } from "@mvuijs/core";

export type GlobalCommand = {
  human_name: string,
  func: () => any,
  shortcut?: string,
}

export const GlobalCommandId = [
  'file_new',
  'file_save',
  'file_save_as',
  'file_save_as_single_page',
  'file_load',
  'file_close',
  'file_export_pdf',

  'history_undo',
  'history_redo',

  'clipboard_paste',
  'selection_cut',
  'selection_copy',
  'selection_delete',

  'zoom_in',
  'zoom_reset',
  'zoom_out',
  'zoom_fit_width',

  'fullscreen_toggle',

  'page_set_style',
  'page_new_after',
  'page_delete',
  'page_move_down',
  'page_move_up',

  'preferences_open',
  'toggle_dark_mode_temp',

  'tool_current_default',
  'tool_pen',
  'tool_highlighter',
  'tool_ruler',
  'tool_ellipse',
  'tool_default_pen',
  'tool_eraser',
  'tool_rectangle',
  'tool_select_rectangle',
  'tool_select_text',
  'tool_text',
  'tool_hand',
  'tool_stroke_width_fine',
  'tool_stroke_width_medium',
  'tool_stroke_width_thick',

  'scroll_page_next',
  'scroll_page_previous',
  'scroll_page_focus_goto',
  'scroll_page_last',
  'scroll_page_first',

  'help_website',
  'help_about',

  'bookmark_add',
  'bookmark_display_toggle',

  'search_box_show',
  'search_box_hide',

  'jumplist_prev',
  'jumplist_next',
  'jumplist_mark',

  'tab_next',
  'tab_prev',
  'new_window',

  'system_show_debug_info',
  'system_update',

  // 'layer_new',
  // 'layer_current_delete',
  // 'layer_current_move_up',
  // 'layer_current_move_down',
  // 'layer_current_toggle_visbility',

] as const;

export type GlobalCommandIdT = typeof GlobalCommandId[number];

export const GlobalCommandsCtx =
  new rx.Context<{ [P in GlobalCommandIdT]: GlobalCommand }>();
