/**
 * A collection of page sizes.
 *
 * Interesting sidenote: While this is by no means universal, several programs
 * that I have tried (MS Word, Sumatra PDF, PDF Annotator) all displayed A4
 * Pages on my screen where 85% zoom would correspond to an actual real A4 Paper
 * - this is identical to my browsers behaviour when setting the page sizes in
 * millimeter(mm). Xournal was also relatively close, while Xournal++ had
 * entirely different values.
 *
 * Testing the display on a HiDPI display would be nice, but this hardware is
 * currently not available to me.
 */
export const WournalPageSize = {
    // real dimensions: 297 mm x 210 mm
    DINA4_PORTRAIT:  {height: 297, width: 210},
    DINA4_LANDSCAPE: {height: 210, width: 297},
    DINA5_PORTRAIT:  {height: 210, width: 148},
    DINA5_LANDSCAPE: {height: 148, width: 210},
}
