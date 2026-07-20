// NewsedIt - SERVPRO CRM Note Assistant
// Popup UI logic for the Chrome extension

document.addEventListener('DOMContentLoaded', function() {
  const autoFillBtn = document.getElementById('autoFillBtn');
  const statusDiv = document.getElementById('status');
  
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
      
      if (!tab.url || !tab.url.includes('servepro.ngsapps.net')) {
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
    chrome.storage.local.set({ noteData: data });
  }

  function loadSavedValues() {
    chrome.storage.local.get(['noteData'], function(result) {
      if (result.noteData) {
        document.getElementById('currentStatus').value = result.noteData.currentStatus || '';
        document.getElementById('recentAction').value = result.noteData.recentAction || '';
        document.getElementById('blocker').value = result.noteData.blocker || '';
        document.getElementById('nextAction').value = result.noteData.nextAction || '';
        document.getElementById('followUp').value = result.noteData.followUp || '';
      }
    });
  }

  function clearFields() {
    document.getElementById('currentStatus').value = '';
    document.getElementById('recentAction').value = '';
    document.getElementById('blocker').value = '';
    document.getElementById('nextAction').value = '';
    document.getElementById('followUp').value = '';
    chrome.storage.local.remove(['noteData']);
  }
});
