/**
 * Normalize arbitrary text for consistent matching.
 * Removes punctuation, digits, and extra whitespace, returning lowercase searchable text.
 */
function normalizeString(value = '') {
  return value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[-_]+/g, ' ')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\b\d+\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Clean dynamic field keys that contain numeric indexes.
 * This helps normalize repeated form field IDs like workExperience-1, workExperience-2, etc.
 */
function normalizeDynamicKey(value = '') {
  return value
    .toString()
    .trim()
    .replace(/(^|[-_])\d+([_-]|$)/g, '$1$2')
    .replace(/[-_]{2,}/g, '--')
    .replace(/(^[-_]+|[-_]+$)/g, '');
}

/**
 * Split normalized text into individual tokens for matching.
 */
function tokenize(value = '') {
  return normalizeString(value)
    .split(' ')
    .filter(Boolean);
}

/**
 * Check whether every token in the key is present in the text.
 * Used to determine if a field text roughly matches a mapping key.
 */
function hasTokenMatch(text, key) {
  const textTokens = new Set(tokenize(text));
  return tokenize(key).every((token) => textTokens.has(token));
}

/**
 * Build one normalized search text string for a field.
 * Combines id, name, label, and placeholder values into a single searchable phrase.
 */
function buildSearchText(field) {
  return normalizeString(
    [normalizeDynamicKey(field.id || ''), field.name, field.label, field.placeholder]
      .filter(Boolean)
      .join(' ')
  );
}

/**
 * Build multiple normalized search text values from a field.
 * This returns separate normalized components for id, name, label, and placeholder.
 */
function buildSearchTexts(field) {
  const idKey = normalizeDynamicKey(field.id || '');

  return [idKey, field.name, field.label, field.placeholder]
    .filter(Boolean)
    .map(normalizeString)
    .filter(Boolean);
}

/**
 * Determine if a field is a phone extension field.
 * Phone extension fields should not be autofilled by the generic phone logic.
 */
function isPhoneExtensionField(field) {
  const searchText = buildSearchText(field);
  return /\b(extension|ext)(?:\.|\b)/.test(searchText) && /\b(phone|tel)\b/.test(searchText);
}

/**
 * Return a default boolean answer for common yes/no fields.
 * Uses heuristic matching to decide whether the field should default to Yes or No.
 */
function getDefaultBooleanAnswer(field) {
  const searchText = buildSearchText(field);

  if (/(have you worked|previously worked|worked for .* previously|prior employment|prior employer|worked previously)/.test(searchText)) {
    return 'No';
  }

  if (/(currently work|still employed|are you currently employed|current employer)/.test(searchText)) {
    return 'No';
  }

  if (/(are you authorized|consent|agree|accept|authorize)/.test(searchText)) {
    return 'Yes';
  }

  return null;
}

/**
 * Extract a work experience instance ID from a field identifier.
 * This is used to group repeated work history entries by section.
 */
function getWorkExperienceInstanceId(field) {
  const source = String(field.id || field.selector || field.name || '');
  const match = source.match(/workExperience-(\d+)/i);
  return match ? Number(match[1]) : null;
}

/**
 * Compute the order of work experience sections from the incoming form fields.
 * Returns the unique IDs in the order they appear in the form.
 */
function buildWorkExperienceOrder(fields) {
  const seen = new Set();
  const ids = [];

  for (const field of fields) {
    const id = getWorkExperienceInstanceId(field);
    if (id === null || seen.has(id)) {
      continue;
    }

    seen.add(id);
    ids.push(id);
  }

  return ids;
}

/**
 * Determine whether a field belongs to a work experience section.
 */
function isWorkExperienceField(field) {
  const searchText = buildSearchText(field);
  return /\bworkexperience\b/.test(searchText) || /workExperience-/i.test(field.id || '');
}

/**
 * Identify the specific work experience field type from normalized field text.
 * This helps map repeated work experience fields to the correct profile value.
 */
function getWorkExperienceFieldType(field) {
  const key = buildSearchText(field);

  if (/\b(job title|jobtitle|position)\b/.test(key)) return 'jobTitle';
  if (/\b(company name|companyname|employer|company)\b/.test(key)) return 'companyName';
  if (/\b(location)\b/.test(key) && !/\bcountry\b/.test(key)) return 'location';
  if (/\b(currently work here|currentlyworkhere|current employer|still employed|currently employed|i currently work here)\b/.test(key)) return 'currentlyWorkHere';
  if (/\b(role description|responsibilities|description)\b/.test(key)) return 'description';
  if (/\b(end.*month|month.*end)\b/.test(key)) return 'endMonth';
  if (/\b(end.*year|year.*end)\b/.test(key)) return 'endYear';
  if (/\b(start.*month|month.*start)\b/.test(key)) return 'startMonth';
  if (/\b(start.*year|year.*start)\b/.test(key)) return 'startYear';

  return null;
}

/**
 * Extract an education instance ID from a field identifier.
 */
function getEducationInstanceId(field) {
  const source = String(field.id || field.selector || field.name || '');
  const match = source.match(/education-(\d+)/i);
  return match ? Number(match[1]) : null;
}

/**
 * Compute the order of education sections from the incoming form fields.
 */
function buildEducationOrder(fields) {
  const seen = new Set();
  const ids = [];

  for (const field of fields) {
    const id = getEducationInstanceId(field);
    if (id === null || seen.has(id)) {
      continue;
    }

    seen.add(id);
    ids.push(id);
  }

  return ids;
}

/**
 * Determine whether a field belongs to an education section.
 */
function isEducationField(field) {
  const searchText = buildSearchText(field);
  return /\beducation\b/.test(searchText) || /education-/i.test(field.id || '');
}

/**
 * Identify the specific education field type from normalized field text.
 */
function getEducationFieldType(field) {
  const key = buildSearchText(field);

  if (/\b(school name|schoolname|institution|college|university)\b/.test(key)) return 'schoolName';
  if (/\b(field of study|fieldofstudy|major|course)\b/.test(key)) return 'fieldOfStudy';
  if (/\b(degree|qualification)\b/.test(key)) return 'degree';
  if (/\b(start date|startdate|datesectionmonth|start.*month|month.*start)\b/.test(key)) return 'startMonth';
  if (/\b(start date|startdate|datesectionyear|start.*year|year.*start)\b/.test(key)) return 'startYear';
  if (/\b(end date|enddate|datesectionmonth|end.*month|month.*end)\b/.test(key)) return 'endMonth';
  if (/\b(end date|enddate|datesectionyear|end.*year|year.*end)\b/.test(key)) return 'endYear';

  return null;
}

/**
 * Determine whether a field is a LinkedIn profile field under social network accounts.
 */
function isLinkedInAccountField(field) {
  const key = buildSearchText(field);
  return /\b(socialnetworkaccounts|linkedinaccount|linkedin account|linkedin)\b/.test(key);
}

module.exports = {
  normalizeString,
  normalizeDynamicKey,
  tokenize,
  hasTokenMatch,
  buildSearchText,
  buildSearchTexts,
  isPhoneExtensionField,
  getDefaultBooleanAnswer,
  getWorkExperienceInstanceId,
  buildWorkExperienceOrder,
  isWorkExperienceField,
  getWorkExperienceFieldType,
  getEducationInstanceId,
  buildEducationOrder,
  isEducationField,
  getEducationFieldType,
  isLinkedInAccountField,
};
