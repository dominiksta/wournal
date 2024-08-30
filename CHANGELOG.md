Changelog
======================================================================

`0.0.8` - _unreleased_
----------------------------------------------------------------------
**Tabs!**

### Added

- Tabs! By default, Wournal will now open documents in tabs. You can still
  create new Windows with Ctrl+Shift+N or in the menu from `Window -> New
  Window`. If you don't like tabs and want every document to open in its own
  window, you can switch to the previous behaviour in the settings under `[Menu]
  -> Edit -> Open Preferences -> UI -> Enable Tabs`.
- New button to reset all settings to default

### Fixed

- PDF zoom preview in dark mode was not inverted, resulting in a flashbang on
  every zoom
- The default document zoom level was not respected for the first page in the
  initial startup document
- Autosaves could not be disabled
- "Recent Files" menu was not sometimes not showing. (This was an upstream bug
  (SAP/ui5-webcomponents#7391)).


`0.0.7` - _2024-08-16_
----------------------------------------------------------------------
**Hotfix for Autosaves and some Quality of Life**

### Added

- A new option (intended for left-handed users) in settings for changing the
  angle of the pen cursor
- When closing Wournal, it will now remember the size and maximized state and
  apply that to any new windows
- Remember the last page when reopening a document

### Fixed

- Autosave on Windows
- Opening the autosave directory from settings would throw an error
- Links and other annotations where active even without the text selection tool

`0.0.6` - _2024-08-08_
----------------------------------------------------------------------
**Jumplist, Toggle Dark Mode, Click to Select and Various Fixes**

### Added

- Clicking on an element with the rectangle selection tool will now select it
- Toggle dark mode temporarily with Ctrl+I
- Use mouse prev/next buttons or Alt+Left/Right to jump between document
  positions, for example to go back when clicking a link in a PDF.
- PDF annotations created by right clicking selected text can now be erased
  gradually
- When a WOJ file is moved and/or renamed with its corresponding PDF, Wournal
  will now look for the PDF with the same name and/or the same new directory.

### Fixed

- Scrolling a PDF too fast would sometimes display an error (#13)
- A potential future issue where an update to wournal may have caused a
  temporary error on first startup (#8)
- PDF text selection in dark mode with inverted document
- Portable versions of Wournal are now *actually* portable, in the sense that
  they store all configuration in a subdirectory of the executable. Before
  0.0.6, all versions of Wournal would share a system wide configuration.
- "Please Wait" prompt would never go away when creating a new document from CLI
- Clicking on an outline item in a large(-ish) PDF would scroll the main
  document viewport slightly out of position.
- Switching to the PDF text selection tool while a PDF page was still rendering
  threw an error.
- In rare cases, Wournal could accidentally produce a stroke with no points/path
  data. This would confuse and crash other parts of Wournal.
- When right clicking text in a PDF to copy or highlight, the page would jump
  around to varying degrees.
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
