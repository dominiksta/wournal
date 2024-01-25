Changelog
======================================================================

`0.0.4` - _unreleased_
----------------------------------------------------------------------

### Added

- Highlight, underline and strike through text in PDF with mouse selection
- Autosaves
- Error Dialog

### Fixed

- An error on startup when the "loading document" dialog was displayed "too
  early"

`0.0.3` - _2024-01-24_
----------------------------------------------------------------------

### Added

- Create and edit an outline of bookmarks
  - Automatically imported from PDF if available
  - Exports to PDF
- Select text in PDF

### Fixed

- Shortcuts are no longer triggered when writing in a text field
- PDF annotations popups are no longer displayed. Maybe a seperate mode to
  display them can be added in the future, but for now hiding them is a lot less
  janky.

`0.0.2` - _2024-01-21_
----------------------------------------------------------------------

### Added

- Open and annotate PDF files (using [pdf.js](https://mozilla.github.io/pdf.js/))
- Export to PDF (using [pdf-lib](https://pdf-lib.js.org/))

### Fixed

- Zooming no longer scrolls the document
- Default SVG background for files created through the CLI was black


`0.0.1` - _2024-01-08_
----------------------------------------------------------------------

### Outline of Initial Features

- Tools:
  - Pen
  - Ruler
  - Rectangle
  - Eraser (both Point and Line)
  - Image
  - Rectangle Select
- Read/Write multi-page documents as WOJ
- Read/Write single-page documents as SVG
- Graph/Ruled/Blank Paper
- Layers
- Settings:
  - Color Palette Editor
  - Respect System Light/Dark Theme
  - Change Tool Default Settings
