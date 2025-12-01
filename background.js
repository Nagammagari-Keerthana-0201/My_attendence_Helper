
console.log('[Keka Tracker] Background service worker initialized');

// Listen for extension installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('[Keka Tracker] Extension installed successfully');
  } else if (details.reason === 'update') {
    console.log('[Keka Tracker] Extension updated to version', chrome.runtime.getManifest().version);
  }
});

// Listen for messages from content scripts (if needed in future)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('[Keka Tracker] Message received:', request);
  
  if (request.action === 'getStats') {
    // Future: Could store/retrieve stats here
    sendResponse({ success: true });
  }
  
  return true; // Keep message channel open for async response
});

// Log when extension icon is clicked
chrome.action.onClicked.addListener((tab) => {
  console.log('[Keka Tracker] Extension icon clicked on tab:', tab.url);
});
