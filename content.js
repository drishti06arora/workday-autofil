// Content script for Workday Autofill.
// This script injects a floating button into the Workday page and extracts fields on demand.

const BUTTON_ID = 'workday-autofill-extract-button';

const getElementLabel = (element) => {
  if (!element) return '';

  const ariaLabel = element.getAttribute('aria-label');
  if (ariaLabel) return ariaLabel.trim();

  const placeholder = element.getAttribute('placeholder');
  if (placeholder) return placeholder.trim();

  const title = element.getAttribute('title');
  if (title) return title.trim();

  if (element.id) {
    const label = document.querySelector(`label[for="${element.id}"]`);
    if (label?.textContent) return label.textContent.trim();
  }

  const parentLabel = element.closest('label');
  if (parentLabel?.textContent) return parentLabel.textContent.trim();

  const ariaLabelledBy = element.getAttribute('aria-labelledby');
  if (ariaLabelledBy) {
    const labelled = document.getElementById(ariaLabelledBy);
    if (labelled?.textContent) return labelled.textContent.trim();
  }

  return '';
};

const buildContextSelector = (element) => {
  if (!element) return '';
  if (element.id) return `#${element.id}`;

  const path = [];
  let current = element;
  while (current && current.nodeType === Node.ELEMENT_NODE && current !== document.documentElement) {
    let selector = current.tagName.toLowerCase();
    if (current.className) {
      const className = current.className.toString().trim().split(/\s+/)[0];
      if (className) selector += `.${className}`;
    }
    const siblings = Array.from(current.parentNode?.children || []).filter((sib) => sib.tagName === current.tagName);
    const siblingIndex = siblings.indexOf(current) + 1;
    if (siblingIndex > 1) selector += `:nth-of-type(${siblingIndex})`;
    path.unshift(selector);
    current = current.parentNode;
  }

  return path.join(' > ');
};

const normalizeValue = (element) => {
  if (!element) return '';

  if (element.tagName.toLowerCase() === 'select') {
    return Array.from(element.selectedOptions || []).map((opt) => opt.value || opt.textContent).join(', ');
  }

  if (element.type === 'checkbox' || element.type === 'radio') {
    return element.checked;
  }

  return element.value ?? '';
};

const isElementVisible = (element) => {
  if (!element || !(element instanceof Element)) return false;
  const style = window.getComputedStyle(element);
  if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
    return false;
  }
  const rect = element.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
};

const looksLikeInternalWorkdayField = (field) => {
  const hashValue = typeof field.value === 'string' && /^[a-f0-9]{24,}$/.test(field.value);
  const noIdentifiers = !field.id && !field.name && !field.label && !field.placeholder;
  const internalSelector = typeof field.selector === 'string' && /(^body > div > div > div\.css-|\.css-[a-z0-9]+$)/.test(field.selector);

  return noIdentifiers && (hashValue || internalSelector);
};

const extractWorkdayFields = () => {
  const fieldElements = Array.from(
    document.querySelectorAll('input, textarea, select, [contenteditable="true"]')
  ).filter((el) => {
    if (el.tagName.toLowerCase() === 'input') {
      return !['submit', 'button', 'reset', 'image', 'hidden'].includes(el.type);
    }
    return isElementVisible(el);
  });

  return fieldElements
    .map((element) => ({
      id: element.id || null,
      name: element.name || null,
      type:
        element.tagName.toLowerCase() === 'input'
          ? element.type || 'text'
          : element.tagName.toLowerCase() === 'div' && element.getAttribute('contenteditable') === 'true'
          ? 'contenteditable'
          : element.tagName.toLowerCase(),
      label: getElementLabel(element) || null,
      placeholder: element.getAttribute('placeholder') || null,
      value: normalizeValue(element),
      selector: buildContextSelector(element),
      required: element.required || false,
      disabled: element.disabled || false,
      readonly: element.readOnly || false,
    }))
    .filter((field) => !looksLikeInternalWorkdayField(field));
};

// Currently the content script is focused on extraction-only testing, so mapping/autofill helpers are omitted.

const createFloatingButton = () => {
  if (document.getElementById(BUTTON_ID)) return;

  const button = document.createElement('button');
  button.id = BUTTON_ID;
  button.textContent = 'Extract Workday Fields';
  button.style.position = 'fixed';
  button.style.bottom = '24px';
  button.style.right = '24px';
  button.style.padding = '12px 16px';
  button.style.zIndex = '999999';
  button.style.border = '1px solid rgba(255,255,255,0.18)';
  button.style.borderRadius = '999px';
  button.style.background = 'rgba(0,0,0,0.88)';
  button.style.color = '#e5e7eb';
  button.style.fontSize = '14px';
  button.style.fontWeight = '600';
  button.style.cursor = 'pointer';
  button.style.boxShadow = '0 14px 38px rgba(0,0,0,0.25)';
  button.style.backdropFilter = 'blur(10px)';
  button.style.pointerEvents = 'auto';
  button.style.transition = 'transform 0.15s ease, opacity 0.15s ease';
  button.style.opacity = '0.95';

  button.addEventListener('mouseenter', () => {
    button.style.transform = 'translateY(-1px)';
    button.style.opacity = '1';
  });
  button.addEventListener('mouseleave', () => {
    button.style.transform = 'translateY(0)';
    button.style.opacity = '0.95';
  });

  button.addEventListener('click', () => {
    button.disabled = true;
    const originalText = button.textContent;
    button.textContent = 'Extracting...';

    const fields = extractWorkdayFields();
    console.log('Extracted Workday fields:', fields);

    if (!fields.length) {
      button.textContent = 'No fields found';
      setTimeout(() => {
        button.textContent = originalText;
        button.disabled = false;
      }, 2000);
      return;
    }

    button.textContent = 'Complete';
    setTimeout(() => {
      button.textContent = originalText;
      button.disabled = false;
    }, 1200);
  });

  document.body.appendChild(button);
};

const setupNavigationWatcher = () => {
  const patchHistoryMethod = (methodName) => {
    const original = history[methodName];
    history[methodName] = function (...args) {
      const result = original.apply(this, args);
      setTimeout(createFloatingButton, 200);
      return result;
    };
  };

  patchHistoryMethod('pushState');
  patchHistoryMethod('replaceState');
  window.addEventListener('popstate', () => setTimeout(createFloatingButton, 200));
};

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
