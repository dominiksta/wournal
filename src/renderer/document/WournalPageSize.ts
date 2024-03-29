/**
 * How many pixels should be displayed for each millimeters of a real
 * document. Sadly, we cannot simply use mm measurements in the svg we produce,
 * because different applications (which might view wournal generated svg) might
 * calculate dpi differently and thus have differing opinions on our document
 * size.
 */
export const MM_TO_PIXEL = 4;

/**
 * Translate any given measurement (cm, mm, etc) into px. See
 * https://stackoverflow.com/a/56549861.
 */
export function xToPx(x: string) {
  // if no measurement is provided, assume pixels
  if (!x.match(/[\d.]+(m|cm|mm|rem|px)/)) x = x + "px"

  let div = document.createElement('div');
  div.style.display = 'block';
  div.style.height = x;
  document.body.appendChild(div);
  let px = parseFloat(window.getComputedStyle(div, null).height);
  div.parentNode.removeChild(div);
  return px;
}

/**
 * Compute an initial zoom factor according to device dpi. When applied, an A4
 * Wournal document should be displayed in the same size as an A4 document in MS
 * Word, Sumatra PDF and other applications.
 */
export function computeZoomFactor() {
  return xToPx(1000 + "mm") / (1000 * MM_TO_PIXEL);
}

export const DEFAULT_ZOOM_FACTOR = computeZoomFactor();

export const WournalPageSizes = [
  'DINA4', 'DINA5',
] as const;

export type WournalPageSizeName = typeof WournalPageSizes[number];

/** A collection of page sizes in px. */
export const WournalPageSize: {
  [K in WournalPageSizeName]: { height: number, width: number }
} = {
  // real dimensions: 297 mm x 210 mm
  DINA4: { height: 297 * MM_TO_PIXEL, width: 210 * MM_TO_PIXEL },
  DINA5: { height: 210 * MM_TO_PIXEL, width: 148 * MM_TO_PIXEL },
}
