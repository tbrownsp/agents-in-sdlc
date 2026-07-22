// NewsedIt - SERVPRO CRM Note Assistant
// Content script that interacts with servepro.ngsapps.net pages

// Listen for messages from the popup
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'fillAndPost') {
    fillAndPostNote(request.data)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ success: false, message: error.message }));
  }
  return true; // Keep the message channel open for async response
});

async function fillAndPostNote(noteData) {
  // Format the note using the 5-part CRM Note Formula
  const formattedNote = formatCRMNote(noteData);
  
  // Find the note input field on the page
  // This selector will need to be adjusted based on the actual Dash CRM DOM structure
  const noteField = findNoteField();
  
  if (!noteField) {
    return { 
      success: false, 
      message: 'Could not find note input field. Please ensure you are on a job page.' 
    };
  }

  // Fill the note field
  noteField.value = formattedNote;
  
  // Trigger input event to ensure the page recognizes the change
  noteField.dispatchEvent(new Event('input', { bubbles: true }));
  noteField.dispatchEvent(new Event('change', { bubbles: true }));
  
  // Find and click the submit/post button, scoped to the note field's container
  const submitButton = findSubmitButton(noteField);
  
  if (!submitButton) {
    return { 
      success: false, 
      message: 'Note filled but could not find submit button. Please select submit manually.' 
    };
  }

  // Click the submit button and wait for an observable CRM confirmation
  submitButton.click();
  
  return waitForSubmitConfirmation(noteField);
}

function isSubmitComplete(noteField) {
  return !document.contains(noteField) || noteField.value === '';
}

function waitForSubmitConfirmation(noteField, timeout = 5000) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    let pollInterval;
    let settled = false;

    function finish(result) {
      if (settled) return;
      settled = true;
      observer.disconnect();
      clearInterval(pollInterval);
      resolve(result);
    }

    const observer = new MutationObserver(() => {
      if (isSubmitComplete(noteField)) {
        finish({ success: true, message: 'Note posted successfully!' });
      }
    });

    // Narrow to structural DOM changes only to avoid expensive attribute/text scans
    observer.observe(document.body, { childList: true, subtree: true });

    pollInterval = setInterval(() => {
      if (isSubmitComplete(noteField)) {
        finish({ success: true, message: 'Note posted successfully!' });
      } else if (Date.now() - startTime > timeout) {
        finish({ success: false, message: 'Could not confirm the note was posted. Please verify in Dash CRM.' });
      }
    }, 200);
  });
}

function formatCRMNote(noteData) {
  // Format using the 5-part CRM Note Formula with section headings
  let note = '';
  
  if (noteData.currentStatus) {
    note += '**Current Status:**\n' + noteData.currentStatus + '\n\n';
  }
  
  if (noteData.recentAction) {
    note += '**Recent Action:**\n' + noteData.recentAction + '\n\n';
  }
  
  if (noteData.blocker) {
    note += '**Blocker/Dependency:**\n' + noteData.blocker + '\n\n';
  }
  
  if (noteData.nextAction) {
    note += '**Next Action:**\n' + noteData.nextAction + '\n\n';
  }
  
  if (noteData.followUp) {
    note += '**Follow-up:**\n' + noteData.followUp;
  }
  
  return note.trim();
}

function findNoteField() {
  // Common selectors for note/comment input fields
  // Adjust these based on the actual Dash CRM structure
  const selectors = [
    'textarea[name*="note"]',
    'textarea[name*="comment"]',
    'textarea[id*="note"]',
    'textarea[id*="comment"]',
    'textarea[placeholder*="note"]',
    'textarea[placeholder*="Note"]',
    'textarea.note-input',
    'textarea.comment-input',
    '#noteText',
    '#commentText',
    '[data-testid*="note"]',
    '[data-testid*="comment"]'
  ];

  for (const selector of selectors) {
    const field = document.querySelector(selector);
    if (field && field.offsetParent !== null) { // Check if visible
      return field;
    }
  }

  return null;
}

function findSubmitButton(noteField) {
  // Scope to the closest form or containing element of the note field
  const container = noteField.closest('form') ||
    noteField.closest('[class*="note"]') ||
    noteField.closest('[class*="comment"]') ||
    noteField.parentElement;

  // Common selectors for submit/post buttons, scoped to the note container
  // Adjust these based on the actual Dash CRM structure
  const selectors = [
    'button[type="submit"]',
    'input[type="submit"]',
    '.btn-submit',
    '.btn-post',
    '#submitNote',
    '#postNote',
    '[data-testid*="submit"]',
    '[data-testid*="post"]'
  ];

  for (const selector of selectors) {
    const button = container.querySelector(selector);
    if (button && button.offsetParent !== null && !button.disabled) {
      return button;
    }
  }

  // Fallback: find buttons with submit-related text within the container
  const buttons = container.querySelectorAll('button, input[type="button"]');
  for (const button of buttons) {
    const text = button.textContent.toLowerCase() || button.value.toLowerCase();
    if ((text.includes('post') || text.includes('submit') || text.includes('save') || text.includes('add')) 
        && button.offsetParent !== null 
        && !button.disabled) {
      return button;
    }
  }

  return null;
}

// Log when content script loads
console.log('NewsedIt content script loaded on', window.location.href);
