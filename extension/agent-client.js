// Local agent client for backend processing
// Handles all communication with the local agent

const AGENT_URL = 'http://127.0.0.1:3000/fill';

const sendFieldsToAgent = async (fields) => {
  if (!Array.isArray(fields) || fields.length === 0) {
    throw new Error('No fields to send');
  }

  const response = await fetch(AGENT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fields }),
  });

  if (!response.ok) {
    throw new Error(`Agent returned ${response.status}`);
  }

  const data = await response.json();
  return data;
};

const dispatchInputEvent = (element) => {
  if (!element) return;
  const eventOptions = { bubbles: true, cancelable: true };
  element.dispatchEvent(new Event('input', eventOptions));
  element.dispatchEvent(new Event('change', eventOptions));
};

const getElementBySelector = (selector) => {
  try {
    return document.querySelector(selector);
  } catch (error) {
    return null;
  }
};

const fillFields = (fills = {}) => {
  let appliedCount = 0;

  Object.entries(fills).forEach(([selector, value]) => {
    const element = getElementBySelector(selector);
    if (!element) return;

    if (element.tagName.toLowerCase() === 'input' && ['checkbox', 'radio'].includes(element.type)) {
      element.checked = Boolean(value);
    } else if (element.tagName.toLowerCase() === 'select') {
      element.value = value;
    } else if (element.isContentEditable) {
      element.textContent = value;
    } else {
      element.value = value;
    }

    dispatchInputEvent(element);
    appliedCount += 1;
  });

  return appliedCount;
};
