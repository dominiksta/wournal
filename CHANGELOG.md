Changelog
======================================================================

`0.0.6` - _unreleased_
----------------------------------------------------------------------

### Added

- Clicking on an element with the rectangle selection tool will now select it
- Toggle dark mode temporarily with Ctrl+I
- PDF annotations created by right clicking selected text can now be erased
  gradually

### Fixed

- Scrolling a PDF too fast would sometimes display an error (#13)
- A potential future issue where an update to wournal may have caused a
  temporary error on first startup (#8)
- PDF text selection in dark mode with inverted document
- Significantly improved logging. While this not technically a bugfix, it should
  help reproducing and fixing future bugs.

`0.0.5` - _2024-05-22_
----------------------------------------------------------------------
**Support for PDF Links and Popup Notes & Many Small Things**

#### Added

- Follow links in PDF documents
- Show PDF popup notes (can be turned off in settings)
- Allow setting a default zoom level for both UI and documents
- Drag and drop files from native file manager into wournal to open
- Tooltip for shortcuts in toolbar buttons (not just in menu)
- List of recent files in menu and in taskbar
- Zoom with Ctrl+Wheel
- Notify on new updates

#### Fixed

- Automatic Deletion of autosaves triggered an error on Windows
- Test pages are no longer created for every new document
- PDF zoom preview scaling on high dpi displays
- Occasionally opening a document would produce an error (there was a race
  condition where elements may have not existed)
- Mouse leaving wournal while held down now properly terminates current action
  (drawing, moving selection, etc.)
- Scrolling while moving a selection (#6)

### Changed

- 'Copy' and 'Cut' buttons are no longer displayed in the toolbar since they now
  pop up dynamically above an active selection

`0.0.4` - _2024-02-13_
----------------------------------------------------------------------
**Outlines and Text Selection**

#### Added

- Full Text Search
- Highlight, underline and strike through text in PDF with mouse selection
- Autosaves
- Error Dialog

#### Fixed

- An error on startup when the "loading document" dialog was displayed "too
  early"
- Highlighter opacity in PDF export

`0.0.3` - _2024-01-24_
----------------------------------------------------------------------
**Full Text Search and Right Click to Highlight Text**

#### Added

- Create and edit an outline of bookmarks
  - Automatically imported from PDF if available
  - Exports to PDF
- Select text in PDF

#### Fixed

- Shortcuts are no longer triggered when writing in a text field
- PDF annotations popups are no longer displayed. Maybe a seperate mode to
  display them can be added in the future, but for now hiding them is a lot less
  janky.

`0.0.2` - _2024-01-21_
----------------------------------------------------------------------
**PDF Annotation and Export**

#### Added

- Open and annotate PDF files (using [pdf.js](https://mozilla.github.io/pdf.js/))
- Export to PDF (using [pdf-lib](https://pdf-lib.js.org/))

#### Fixed

- Zooming no longer scrolls the document
- Default SVG background for files created through the CLI was black


`0.0.1` - _2024-01-08_
----------------------------------------------------------------------
**Hello, World!**

#### Outline of Initial Features

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
