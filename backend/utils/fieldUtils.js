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

function normalizeDynamicKey(value = '') {
  return value
    .toString()
    .trim()
    .replace(/(^|[-_])\d+([_-]|$)/g, '$1$2')
    .replace(/[-_]{2,}/g, '--')
    .replace(/(^[-_]+|[-_]+$)/g, '');
}

function tokenize(value = '') {
  return normalizeString(value)
    .split(' ')
    .filter(Boolean);
}

function hasTokenMatch(text, key) {
  const textTokens = new Set(tokenize(text));
  return tokenize(key).every((token) => textTokens.has(token));
}

function buildSearchText(field) {
  return normalizeString(
    [normalizeDynamicKey(field.id || ''), field.name, field.label, field.placeholder]
      .filter(Boolean)
      .join(' ')
  );
}

function buildSearchTexts(field) {
  const idKey = normalizeDynamicKey(field.id || '');

  return [idKey, field.name, field.label, field.placeholder]
    .filter(Boolean)
    .map(normalizeString)
    .filter(Boolean);
}

function isPhoneExtensionField(field) {
  const searchText = buildSearchText(field);
  return /\b(extension|ext)(?:\.|\b)/.test(searchText) && /\b(phone|tel)\b/.test(searchText);
}

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

function getWorkExperienceInstanceId(field) {
  const source = String(field.id || field.selector || field.name || '');
  const match = source.match(/workExperience-(\d+)/i);
  return match ? Number(match[1]) : null;
}

function buildWorkExperienceOrder(fields) {
  return Array.from(
    new Set(
      fields
        .map(getWorkExperienceInstanceId)
        .filter((id) => id !== null)
    )
  ).sort((a, b) => b - a);
}

function isWorkExperienceField(field) {
  const searchText = buildSearchText(field);
  return /\bworkexperience\b/.test(searchText) || /workExperience-/i.test(field.id || '');
}

function getWorkExperienceFieldType(field) {
  const key = buildSearchText(field);

  if (/\b(job title|jobtitle|position)\b/.test(key)) return 'jobTitle';
  if (/\b(company name|companyname|employer|company)\b/.test(key)) return 'companyName';
  if (/\b(location)\b/.test(key) && !/\bcountry\b/.test(key)) return 'location';
  if (/\b(currently work here|currentlyworkhere|current employer|still employed|currently employed|i currently work here)\b/.test(key)) return 'currentlyWorkHere';
  if (/\b(role description|responsibilities|description)\b/.test(key)) return 'roleDescription';
  if (/\b(start date|startdate|datesectionmonth|start.*month|month.*start)\b/.test(key)) return 'startMonth';
  if (/\b(start date|startdate|datesectionyear|start.*year|year.*start)\b/.test(key)) return 'startYear';
  if (/\b(end date|enddate|datesectionmonth|end.*month|month.*end)\b/.test(key)) return 'endMonth';
  if (/\b(end date|enddate|datesectionyear|end.*year|year.*end)\b/.test(key)) return 'endYear';

  return null;
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
};
