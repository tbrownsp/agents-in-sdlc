// content.js — SERVPRO Note Injector
// Listens for injection requests from the extension popup and writes a note
// into the Dash CRM note textarea, then optionally submits it.
//
// SELECTOR CONFIGURATION
// ----------------------
// These selectors target the "Add New" note form on the SERVPRO Dash job board
// (https://servpro.ngsapps.net/Enterprise/Module/Job/jJobSlideBoard.aspx).
//
// To find the correct IDs for YOUR Dash instance:
//   1. Open a job in Dash and click the [Add New] button in the Notes grid.
//   2. Right-click inside the blank note text area and choose Inspect.
//   3. Look for an attribute like id="txtNoteBody" or name="txtNoteBody".
//   4. Do the same for the Save / Submit button.
//   5. Update the two constants below and reload the extension.
//
// Common Dash control IDs (update if yours differ):
const NOTE_TEXTAREA_SELECTOR = '#txtNoteBody';
const SAVE_BUTTON_SELECTOR   = '#btnSaveNote';

// AUTO_SAVE — set to true to automatically click Save after injecting the note.
const AUTO_SAVE = false;

// ─── Message listener ────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === 'injectNote') {
    const result = injectNote(message.noteText, message.autoSave ?? AUTO_SAVE);
    sendResponse(result);
  }
  // Return true to allow async sendResponse if needed in future.
  return true;
});

// ─── Core injection logic ────────────────────────────────────────────────────

/**
 * Injects `noteText` into the Dash CRM note textarea and optionally saves it.
 *
 * @param {string}  noteText  The note body to inject.
 * @param {boolean} autoSave  When true, the save button is clicked automatically.
 * @returns {{ success: boolean, message: string }}
 */
function injectNote(noteText, autoSave = AUTO_SAVE) {
  const noteBox    = document.querySelector(NOTE_TEXTAREA_SELECTOR);
  const saveButton = document.querySelector(SAVE_BUTTON_SELECTOR);

  if (!noteBox) {
    const msg = `SERVPRO Note Injector: Could not find note textarea (${NOTE_TEXTAREA_SELECTOR}). ` +
                'Make sure the Add New form is open and your selector is correct.';
    console.error(msg);
    return { success: false, message: msg };
  }

  // Set the value and fire native input/change events so the Dash
  // framework (ASP.NET WebForms + any client-side validators) detects
  // the programmatic change.
  noteBox.value = noteText;
  noteBox.dispatchEvent(new Event('input',  { bubbles: true }));
  noteBox.dispatchEvent(new Event('change', { bubbles: true }));

  if (autoSave) {
    if (!saveButton) {
      const msg = `SERVPRO Note Injector: Note text injected but could not find Save button ` +
                  `(${SAVE_BUTTON_SELECTOR}). Please save manually.`;
      console.warn(msg);
      return { success: true, message: msg };
    }
    saveButton.click();
    console.log('SERVPRO Note Injector: Note injected and Save button clicked.');
    return { success: true, message: 'Note injected and saved.' };
  }

  console.log('SERVPRO Note Injector: Note injected successfully. Save manually to submit.');
  return { success: true, message: 'Note injected. Click Save to submit.' };
}
