// background.js — SERVPRO Note Injector service worker
// Relays messages from the popup to the active Dash tab's content script.

chrome.action.onClicked.addListener(async (tab) => {
  // The popup handles the click — this listener is a no-op but kept as a
  // fallback in case the popup is not shown (e.g., during development).
  console.log('SERVPRO Note Injector active on tab:', tab.id);
});
