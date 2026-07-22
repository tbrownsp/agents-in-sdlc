// NewsedIt - SERVPRO CRM Note Assistant
// Popup UI logic for the Chrome extension

document.addEventListener('DOMContentLoaded', async function() {
  const autoFillBtn = document.getElementById('autoFillBtn');
  const statusDiv = document.getElementById('status');

  // Derive a job-scoped storage key from the active tab URL so drafts are
  // isolated per job and prevent drafts from being loaded or cleared for the wrong record.
  let currentJobKey = 'noteData_default';
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url) {
      const url = new URL(tab.url);
      // Sanitize the URL path into a safe storage key: replace path separators
      // with underscores and strip characters that are not alphanumeric, underscore, or hyphen.
      const jobId = url.pathname.replace(/\//g, '_').replace(/[^a-zA-Z0-9_-]/g, '') || 'root';
      currentJobKey = 'noteData_' + jobId;
    }
  } catch (e) {
    // Fall back to the default key
  }

  // Load saved values from storage
  loadSavedValues();
  
  // Auto-save values as user types
  const inputs = ['currentStatus', 'recentAction', 'blocker', 'nextAction', 'followUp'];
  inputs.forEach(id => {
    const element = document.getElementById(id);
    element.addEventListener('input', () => {
      saveValues();
    });
  });

  autoFillBtn.addEventListener('click', async function() {
    const noteData = {
      currentStatus: document.getElementById('currentStatus').value.trim(),
      recentAction: document.getElementById('recentAction').value.trim(),
      blocker: document.getElementById('blocker').value.trim(),
      nextAction: document.getElementById('nextAction').value.trim(),
      followUp: document.getElementById('followUp').value.trim()
    };

    // Validate that at least some fields are filled
    const hasContent = Object.values(noteData).some(val => val.length > 0);
    if (!hasContent) {
      showStatus('Please fill in at least one field', 'error');
      return;
    }

    // Disable button during processing
    autoFillBtn.disabled = true;
    autoFillBtn.textContent = 'Processing...';

    try {
      // Get the active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab.url || new URL(tab.url).hostname !== 'servepro.ngsapps.net') {
        showStatus('Please open servepro.ngsapps.net first', 'error');
        autoFillBtn.disabled = false;
        autoFillBtn.textContent = 'Auto-Fill & Post Note';
        return;
      }

      // Send message to content script to fill and post
      chrome.tabs.sendMessage(tab.id, {
        action: 'fillAndPost',
        data: noteData
      }, function(response) {
        if (chrome.runtime.lastError) {
          showStatus('Error: ' + chrome.runtime.lastError.message, 'error');
        } else if (response && response.success) {
          showStatus('Note posted successfully!', 'success');
          // Clear fields after successful post
          clearFields();
        } else {
          showStatus(response?.message || 'Failed to post note', 'error');
        }
        
        autoFillBtn.disabled = false;
        autoFillBtn.textContent = 'Auto-Fill & Post Note';
      });
    } catch (error) {
      showStatus('Error: ' + error.message, 'error');
      autoFillBtn.disabled = false;
      autoFillBtn.textContent = 'Auto-Fill & Post Note';
    }
  });

  function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = 'status ' + type;
    statusDiv.style.display = 'block';
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      statusDiv.style.display = 'none';
    }, 5000);
  }

  function saveValues() {
    const data = {
      currentStatus: document.getElementById('currentStatus').value,
      recentAction: document.getElementById('recentAction').value,
      blocker: document.getElementById('blocker').value,
      nextAction: document.getElementById('nextAction').value,
      followUp: document.getElementById('followUp').value
    };
    chrome.storage.local.set({ [currentJobKey]: data });
  }

  function loadSavedValues() {
    chrome.storage.local.get([currentJobKey], function(result) {
      if (result[currentJobKey]) {
        document.getElementById('currentStatus').value = result[currentJobKey].currentStatus || '';
        document.getElementById('recentAction').value = result[currentJobKey].recentAction || '';
        document.getElementById('blocker').value = result[currentJobKey].blocker || '';
        document.getElementById('nextAction').value = result[currentJobKey].nextAction || '';
        document.getElementById('followUp').value = result[currentJobKey].followUp || '';
      }
    });
  }

  function clearFields() {
    document.getElementById('currentStatus').value = '';
    document.getElementById('recentAction').value = '';
    document.getElementById('blocker').value = '';
    document.getElementById('nextAction').value = '';
    document.getElementById('followUp').value = '';
    chrome.storage.local.remove([currentJobKey]);
  }
});
