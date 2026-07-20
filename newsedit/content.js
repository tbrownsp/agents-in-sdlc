// NewsedIt - SERVPRO CRM Note Assistant
// Content script that interacts with servepro.ngsapps.net pages

// Listen for messages from the popup
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'fillAndPost') {
    try {
      const result = fillAndPostNote(request.data);
      sendResponse(result);
    } catch (error) {
      sendResponse({ success: false, message: error.message });
    }
  }
  return true; // Keep the message channel open for async response
});

function fillAndPostNote(noteData) {
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
  
  // Find and click the submit/post button
  const submitButton = findSubmitButton();
  
  if (!submitButton) {
    return { 
      success: false, 
      message: 'Note filled but could not find submit button. Please click submit manually.' 
    };
  }

  // Click the submit button
  submitButton.click();
  
  return { 
    success: true, 
    message: 'Note posted successfully!' 
  };
}

function formatCRMNote(noteData) {
  // Format using first-person PM voice as specified in the agent instructions
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

  // Fallback: find any visible textarea
  const textareas = document.querySelectorAll('textarea');
  for (const textarea of textareas) {
    if (textarea.offsetParent !== null && !textarea.disabled) {
      return textarea;
    }
  }

  return null;
}

function findSubmitButton() {
  // Common selectors for submit/post buttons
  // Adjust these based on the actual Dash CRM structure
  const selectors = [
    'button[type="submit"]',
    'input[type="submit"]',
    'button:contains("Post")',
    'button:contains("Submit")',
    'button:contains("Add Note")',
    'button:contains("Save")',
    '.btn-submit',
    '.btn-post',
    '#submitNote',
    '#postNote',
    '[data-testid*="submit"]',
    '[data-testid*="post"]'
  ];

  for (const selector of selectors) {
    const button = document.querySelector(selector);
    if (button && button.offsetParent !== null && !button.disabled) {
      return button;
    }
  }

  // Fallback: find buttons with submit-related text
  const buttons = document.querySelectorAll('button, input[type="button"]');
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
