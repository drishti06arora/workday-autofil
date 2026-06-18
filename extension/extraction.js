// Field extraction logic for Workday pages
// Pure extraction, no UI or backend calls

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

const normalizeFieldKey = (value = '') =>
  value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/(^|[^a-z0-9])+/g, ' ')
    .replace(/\b\d+\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const normalizeDynamicId = (value = '') =>
  value
    .toString()
    .trim()
    .replace(/(^|[-_])\d+([_-]|$)/g, '$1$2')
    .replace(/[-_]{2,}/g, '--')
    .replace(/(^[-_]+|[-_]+$)/g, '');

const isElementVisible = (element) => {
  if (!element || !(element instanceof Element)) return false;
  const style = window.getComputedStyle(element);
  if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
    return false;
  }
  const rect = element.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
};

const autoExpandDynamicSections = () => {
  const candidateSelectors = [
    'button',
    'input[type="button"]',
    'input[type="submit"]',
    '[role="button"]',
    'a',
  ];

  const buttons = Array.from(document.querySelectorAll(candidateSelectors.join(','))).filter((element) => {
    if (!isElementVisible(element)) return false;
    if (element.disabled) return false;

    const text = (element.textContent || element.value || '').toString().trim();
    return /\badd\b/i.test(text) || /\badd another\b/i.test(text) || /\badd experience\b/i.test(text) || /\badd education\b/i.test(text);
  });

  buttons.forEach((button) => {
    if (!button.dataset.workdayAutoClicked) {
      button.dataset.workdayAutoClicked = 'true';
      button.click();
    }
  });
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

const extractWorkdayFields = async () => {
  autoExpandDynamicSections();
  await new Promise((resolve) => setTimeout(resolve, 180));

  const fieldElements = Array.from(
    document.querySelectorAll('input, textarea, select, [contenteditable="true"]')
  ).filter((el) => {
    if (el.tagName.toLowerCase() === 'input') {
      return !['submit', 'button', 'reset', 'image', 'hidden'].includes(el.type);
    }
    return isElementVisible(el);
  });

  return fieldElements.map((element) => {
    const id = element.id || null;
    const name = element.name || null;
    const label = getElementLabel(element) || null;
    const placeholder = element.getAttribute('placeholder') || null;
    const normalizedId = normalizeDynamicId(id || name || label || placeholder || '');

    return {
      id,
      name,
      normalizedId,
      type:
        element.tagName.toLowerCase() === 'input'
          ? element.type || 'text'
          : element.tagName.toLowerCase() === 'div' && element.getAttribute('contenteditable') === 'true'
          ? 'contenteditable'
          : element.tagName.toLowerCase(),
      label,
      placeholder,
      value: normalizeValue(element),
      selector: buildContextSelector(element),
      required: element.required || false,
      disabled: element.disabled || false,
      readonly: element.readOnly || false,
      baseKey: normalizeFieldKey(`${normalizedId} ${name || ''} ${label || ''} ${placeholder || ''}`),
    };
  });
};
