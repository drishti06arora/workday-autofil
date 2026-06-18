// Content script entry point
// Loads modular components and handles message passing

// Message handler for popup communication
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || !message.type) return;

  if (message.type === 'GET_FIELDS') {
    sendResponse(extractWorkdayFields());
    return true;
  }

  if (message.type === 'APPLY_FIELDS' && message.fills) {
    const applied = fillFields(message.fills);
    sendResponse({ success: true, applied });
    return true;
  }
});

// Initialize UI
const init = () => {
  if (!document.body) {
    window.addEventListener('DOMContentLoaded', init, { once: true });
    return;
  }

  createFloatingButton();
  setupNavigationWatcher();
};

init();

console.log('Workday Autofill content script loaded');
