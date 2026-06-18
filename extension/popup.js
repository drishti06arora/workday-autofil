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

      if (!fields?.length) {
        throw new Error('No extractable fields found');
      }

      const agentResponse = await fetch('http://127.0.0.1:3000/fill', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fields }),
      });

      if (!agentResponse.ok) {
        throw new Error(`Agent returned ${agentResponse.status}`);
      }

      const data = await agentResponse.json();
      console.log('Agent response:', data);

      const applyResult = await chrome.tabs.sendMessage(tab.id, {
        type: 'APPLY_FIELDS',
        fills: data.fills,
      });

      console.log('Apply result:', applyResult);
    } catch (error) {
      console.error('Field extraction failed:', error);
    } finally {
      extractButton.disabled = false;
      extractButton.textContent = originalText;
    }
  });
});
