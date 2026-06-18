// Local agent client for backend processing
// Handles all communication with the local agent

const AGENT_URL = 'http://127.0.0.1:3000/fill';

const normalizeString = (value = '') =>
  value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .trim();

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
  element.dispatchEvent(new Event('blur', eventOptions));
};

const getElementBySelector = (selector) => {
  try {
    return document.querySelector(selector);
  } catch (error) {
    return null;
  }
};

const getElementsBySelector = (selector) => {
  try {
    return Array.from(document.querySelectorAll(selector));
  } catch (error) {
    return [];
  }
};

const findMatchingOption = (select, value) => {
  const target = normalizeString(value);
  const options = Array.from(select.options || []);

  let match = options.find((option) => normalizeString(option.value) === target || normalizeString(option.textContent || '') === target);
  if (!match) {
    match = options.find((option) => normalizeString(option.textContent || '').includes(target) || normalizeString(option.value).includes(target));
  }

  return match;
};

const fillSelectElement = (element, value) => {
  if (!element || value === null || value === undefined) return false;

  const match = findMatchingOption(element, value);
  if (match) {
    element.value = match.value;
    match.selected = true;
    dispatchInputEvent(element);
    return true;
  }

  if (typeof value === 'string') {
    element.value = value;
    dispatchInputEvent(element);
    return true;
  }

  return false;
};

const fillRadioGroup = (element, value) => {
  if (!element || element.type !== 'radio') return false;
  const groupName = element.name;
  const radios = groupName
    ? Array.from(document.querySelectorAll(`input[type="radio"][name="${CSS.escape(groupName)}"]`))
    : [element];
  const target = normalizeString(value);

  const match = radios.find((radio) => {
    const radioValue = normalizeString(radio.value || '');
    const ariaLabel = normalizeString(radio.getAttribute('aria-label') || '');
    const label = normalizeString(radio.labels?.[0]?.textContent || '');
    return radioValue === target || ariaLabel === target || label === target;
  });

  if (match) {
    match.checked = true;
    dispatchInputEvent(match);
    return true;
  }

  return false;
};

const fillFields = (fills = {}) => {
  let appliedCount = 0;

  Object.entries(fills).forEach(([selector, value]) => {
    const element = getElementBySelector(selector);
    const elements = !element ? getElementsBySelector(selector) : [element];
    const target = elements.length ? elements[0] : null;
    if (!target) return;

    let applied = false;
    const tagName = target.tagName.toLowerCase();

    if (tagName === 'select') {
      applied = fillSelectElement(target, value);
    } else if (tagName === 'input') {
      const inputType = target.type.toLowerCase();
      if (['checkbox'].includes(inputType)) {
        target.checked = Boolean(value);
        dispatchInputEvent(target);
        applied = true;
      } else if (['radio'].includes(inputType)) {
        applied = fillRadioGroup(target, value);
      } else {
        target.value = value;
        dispatchInputEvent(target);
        applied = true;
      }
    } else if (target.isContentEditable) {
      target.textContent = value;
      dispatchInputEvent(target);
      applied = true;
    } else {
      target.value = value;
      dispatchInputEvent(target);
      applied = true;
    }

    if (applied) appliedCount += 1;
  });

  return appliedCount;
};
