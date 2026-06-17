// Popup script for Workday Autofill extension.
// This file handles UI interaction and requests field extraction from the page.

document.addEventListener('DOMContentLoaded', () => {
  const extractButton = document.getElementById('extract-button');
  if (!extractButton) return;

  extractButton.addEventListener('click', async () => {
    extractButton.disabled = true;
    const originalText = extractButton.textContent;
    extractButton.textContent = 'Extracting...';

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) {
        throw new Error('No active tab found');
      }

      const fields = await chrome.tabs.sendMessage(tab.id, {
        type: 'GET_FIELDS'
      });

      console.log('FIELDS:', fields);
    } catch (error) {
      console.error('Field extraction failed:', error);
    } finally {
      extractButton.disabled = false;
      extractButton.textContent = originalText;
    }
  });
});
