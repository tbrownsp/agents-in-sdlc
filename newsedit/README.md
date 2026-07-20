# NewsedIt - SERVPRO CRM Note Assistant

A Chrome extension that streamlines CRM note creation and posting for SERVPRO Bartlett/Cordova using the standardized 5-part PM note formula.

## Features

- **5-Part CRM Note Formula**: Structured inputs for:
  1. Current Status
  2. Recent Action
  3. Blocker/Dependency
  4. Next Action
  5. Follow-up Date/Trigger

- **Auto-save**: Your draft notes are automatically saved as you type
- **One-click posting**: Fill and post notes directly to Dash CRM
- **Professional formatting**: Notes are formatted in first-person PM voice as per SERVPRO standards

## Installation Instructions

### Step 1: Download the Extension

Clone or download this repository to get the `newsedit` folder containing all the extension files.

### Step 2: Open Chrome Extensions

1. Open Google Chrome
2. Navigate to `chrome://extensions/`
3. Toggle **Developer Mode** on (top right corner)

### Step 3: Load the Extension

1. Click **Load unpacked** (top left corner)
2. Select the `newsedit` folder
3. The NewsedIt extension icon should appear in your browser toolbar

### Step 4: Use the Extension

1. Open `servepro.ngsapps.net`
2. Navigate to any of your active jobs
3. Click the NewsedIt extension icon in your toolbar
4. Fill in the 5-part CRM note fields
5. Click **Auto-Fill & Post Note** to commit instantly

## Files Included

- `manifest.json` - Extension configuration and permissions
- `popup.html` - User interface for the extension popup
- `popup.js` - Logic for handling user input and storage
- `content.js` - Content script that interacts with the Dash CRM page
- `icon.png` - Extension icon (48x48 pixels)
- `README.md` - This file

## How It Works

The extension uses Chrome's content script API to:

1. Detect when you're on `servepro.ngsapps.net`
2. Format your notes according to the 5-part CRM formula
3. Find the note input field on the page
4. Auto-fill the formatted note
5. Submit the note to Dash CRM

## Notes

- The extension only works on `servepro.ngsapps.net`
- Notes are formatted using first-person PM voice ("I followed up...", "Customer advised...", etc.)
- All data is stored locally in your browser - nothing is sent to external servers
- The extension requires the page structure of Dash CRM to remain consistent

## Customization

If the Dash CRM page structure changes, you may need to update the selectors in `content.js`:

- `findNoteField()` - Locates the note input textarea
- `findSubmitButton()` - Locates the submit/post button

## Support

For issues or questions, contact Tristan Brown or refer to the SERVPRO PM operating procedures.

## Version

Current version: 1.0.0

---

**SERVPRO Bartlett/Cordova**  
Professional Restoration Project Management
