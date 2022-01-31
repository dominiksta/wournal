/**
 * How many pixels should be displayed for each millimeters of a real
 * document. Sadly, we cannot simply use mm measurements in the svg we produce,
 * because different applications (which might view wournal generated svg) might
 * calculate dpi differently and thus have differing opinions on our document
 * size.
 */
const MM_TO_PIXEL = 4;

/**
 * Compute an initial zoom factor according to device dpi. When applied, an A4
 * Wournal document should be displayed in the same size as an A4 document in MS
 * Word, Sumatra PDF and other applications.
 */
export function computeZoomFactor() {
    // Return the height `x` in any format (such as cm, mm, etc.) in px.
    // See https://stackoverflow.com/a/56549861.
    const xToPx = (x: string) => {
        var div = document.createElement('div');
        div.style.display = 'block';
        div.style.height = x;
        document.body.appendChild(div);
        var px = parseFloat(window.getComputedStyle(div, null).height);
        div.parentNode.removeChild(div);
        return px;
    }
    return xToPx(1000 + "mm") / (1000 * MM_TO_PIXEL);
}

/** A collection of page sizes in px. */
export const WournalPageSize = {
    // real dimensions: 297 mm x 210 mm
    DINA4_PORTRAIT:  {height: 297 * MM_TO_PIXEL, width: 210 * MM_TO_PIXEL},
    DINA4_LANDSCAPE: {height: 210 * MM_TO_PIXEL, width: 297 * MM_TO_PIXEL},
    DINA5_PORTRAIT:  {height: 210 * MM_TO_PIXEL, width: 148 * MM_TO_PIXEL},
    DINA5_LANDSCAPE: {height: 148 * MM_TO_PIXEL, width: 210 * MM_TO_PIXEL},
}
