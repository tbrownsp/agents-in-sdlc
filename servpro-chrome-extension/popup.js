// popup.js — SERVPRO Note Injector popup controller

const noteTextEl = document.getElementById('noteText');
const autoSaveEl = document.getElementById('autoSave');
const injectBtn  = document.getElementById('injectBtn');
const statusEl   = document.getElementById('status');

// Persist the last-used note text and auto-save preference across popup opens.
chrome.storage.local.get(['lastNote', 'autoSave'], ({ lastNote, autoSave }) => {
  if (lastNote)  noteTextEl.value = lastNote;
  if (autoSave !== undefined) autoSaveEl.checked = autoSave;
});

noteTextEl.addEventListener('input', () => {
  chrome.storage.local.set({ lastNote: noteTextEl.value });
});

autoSaveEl.addEventListener('change', () => {
  chrome.storage.local.set({ autoSave: autoSaveEl.checked });
});

injectBtn.addEventListener('click', async () => {
  const noteText = noteTextEl.value.trim();
  if (!noteText) {
    setStatus('Please enter a note before injecting.', 'error');
    return;
  }

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) {
    setStatus('No active tab found.', 'error');
    return;
  }

  try {
    // Send the injection request to the content script already running on the page.
    const response = await chrome.tabs.sendMessage(tab.id, {
      action:   'injectNote',
      noteText,
      autoSave: autoSaveEl.checked,
    });

    if (response?.success) {
      setStatus(response.message, 'success');
    } else {
      setStatus(response?.message ?? 'Injection failed.', 'error');
    }
  } catch (err) {
    setStatus(
      'Could not reach the page. Make sure a SERVPRO Dash job is open and ' +
      'the Add New note form is visible, then try again.',
      'error'
    );
    console.error('SERVPRO Note Injector popup error:', err);
  }
});

function setStatus(message, type) {
  statusEl.textContent = message;
  statusEl.className = type;
}
