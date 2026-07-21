# SERVPRO Note Injector — Chrome Extension

A Manifest V3 Chrome extension that injects pre-written CRM notes into the
SERVPRO Dash job board, saving time on repetitive note entry.

## Files

| File | Purpose |
|------|---------|
| `manifest.json` | Extension manifest (Manifest V3) |
| `content.js` | Content script — injects text into the Dash note form |
| `background.js` | Service worker — minimal relay/lifecycle handler |
| `popup.html` | Extension popup UI |
| `popup.js` | Popup controller — sends the note to the content script |

## Installation (developer mode)

1. Open Chrome and navigate to `chrome://extensions`.
2. Enable **Developer mode** (top-right toggle).
3. Click **Load unpacked** and select this `servpro-chrome-extension/` folder.
4. The SERVPRO Note Injector icon appears in your toolbar.

## Usage

1. Open a SERVPRO Dash job (`servpro.ngsapps.net/…/jJobSlideBoard.aspx?…`).
2. Click **[Add New]** in the Notes grid so the note entry form appears.
3. Click the extension icon in your Chrome toolbar.
4. Type or paste your note text into the popup.
5. (Optional) Check **Auto-save** to automatically click the Save button.
6. Click **Inject Note**.

## Updating the HTML selectors

The extension targets these two selectors in `content.js`:

```javascript
const NOTE_TEXTAREA_SELECTOR = '#txtNoteBody';
const SAVE_BUTTON_SELECTOR   = '#btnSaveNote';
```

If the note text box or Save button is not found on your Dash instance:

1. Open a job in Dash and click **[Add New]** so the entry form appears.
2. Right-click directly inside the blank note text area → **Inspect**.
3. In the highlighted HTML line, look for the `id="…"` attribute (e.g.,
   `<textarea id="txtNoteBody" …>`).
4. Repeat for the **Save** / **Submit** button.
5. Update the two constants at the top of `content.js` with the correct IDs.
6. Return to `chrome://extensions` and click the **↺ Refresh** icon for this
   extension to reload the updated script.

> [!NOTE]
> ASP.NET WebForms controls sometimes render with a full `ctl00$…` name-path
> prefix in addition to the short `id`. If a short `#id` selector does not
> work, use the browser inspector to copy the full element selector.

## Auto-save behaviour

`AUTO_SAVE` defaults to `false` in `content.js`. You can override it per-click
in the popup with the **Auto-save** checkbox, or change the default by setting
`const AUTO_SAVE = true;` in `content.js`.

When `AUTO_SAVE` is `false` the note text is injected into the text area but
the form is **not** submitted — giving you a chance to review the note before
saving.
