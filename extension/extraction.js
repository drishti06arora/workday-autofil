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

const extractWorkdayFields = () => {
  const fieldElements = Array.from(
    document.querySelectorAll('input, textarea, select, [contenteditable="true"]')
  ).filter((el) => {
    if (el.tagName.toLowerCase() === 'input') {
      return !['submit', 'button', 'reset', 'image', 'hidden'].includes(el.type);
    }
    return isElementVisible(el);
  });

  return fieldElements.map((element) => ({
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
  }));
};
