const FieldMappingRepository = require('../database/fieldMappingRepository');
const {
  buildSearchText,
  buildSearchTexts,
  getDefaultBooleanAnswer,
  isPhoneExtensionField,
  buildWorkExperienceOrder,
  isWorkExperienceField,
  getWorkExperienceFieldType,
  getEducationInstanceId,
  buildEducationOrder,
  isEducationField,
  getEducationFieldType,
  getWorkExperienceInstanceId,
  isLinkedInAccountField,
} = require('../utils/fieldUtils');

const repository = new FieldMappingRepository();

/**
 * Determine the best autofill value for a single form field.
 * Uses field metadata, mappings, expected values, and work experience order to choose a fill value.
 */
function chooseValue(field, experienceOrder = [], educationOrder = []) {
  if (!field || field.type === 'file') {
    return null;
  }

  if (!field.id && !field.name && !field.label && !field.placeholder) {
    return null;
  }

  if (isPhoneExtensionField(field)) {
    return null;
  }

  const searchTexts = buildSearchTexts(field);
  const defaultBoolean = getDefaultBooleanAnswer(field);

  if (defaultBoolean !== null) {
    if (field.type === 'checkbox') {
      return defaultBoolean.toLowerCase() === 'yes';
    }
    return defaultBoolean;
  }

  if (field.type === 'checkbox') {
    const fieldText = buildSearchText(field);
    if (/(agree|consent|accept|authorize|same as)/.test(fieldText)) {
      return true;
    }
    return null;
  }

  if (field.type === 'radio') {
    return field.value || null;
  }

  if (field.type === 'select') {
    const mappedValue = repository.getFieldMapping(buildSearchText(field));
    if (mappedValue) {
      return mappedValue;
    }
    return field.value || null;
  }

  if (isWorkExperienceField(field)) {
    const profile = repository.getExperienceProfile(field, experienceOrder);
    const fieldType = getWorkExperienceFieldType(field);
    if (profile && fieldType) {
      if (fieldType === 'jobTitle') {
        return profile.title;
      }
      if (fieldType === 'companyName') {
        return profile.company;
      }
      return profile[fieldType];
    }
  }

  if (isEducationField(field)) {
    const profile = repository.getEducationProfile(field, educationOrder);
    const fieldType = getEducationFieldType(field);
    if (profile && fieldType) {
      return profile[fieldType];
    }
  }

  if (isLinkedInAccountField(field)) {
    return repository.findExpectedValue(['socialnetworkaccounts', 'linkedinaccount', 'linkedin']);
  }

  const expectedValue = repository.findExpectedValue(searchTexts);
  if (expectedValue) {
    return expectedValue;
  }

  const mappedValue = repository.getFieldMapping(buildSearchText(field));
  if (mappedValue) {
    return mappedValue;
  }

  return null;
}

/**
 * Build the response payload for a batch of form fields.
 * Returns a map of selector => value along with a summary of requested and recommended fields.
 */
function fillFields(fields) {
  if (!Array.isArray(fields)) {
    throw new Error('`fields` must be an array');
  }

  const experienceOrder = buildWorkExperienceOrder(fields);
  const allowedWorkExperienceIds = new Set(
    experienceOrder.slice(0, repository.getExperienceProfileCount())
  );

  const educationOrder = buildEducationOrder(fields);
  const allowedEducationIds = new Set(
    educationOrder.slice(0, repository.getEducationProfileCount())
  );

  const fills = fields.reduce((acc, field) => {
    if (isWorkExperienceField(field)) {
      const workExperienceId = getWorkExperienceInstanceId(field);
      if (workExperienceId !== null && !allowedWorkExperienceIds.has(workExperienceId)) {
        return acc;
      }
    }

    if (isEducationField(field)) {
      const educationId = getEducationInstanceId(field);
      if (educationId !== null && !allowedEducationIds.has(educationId)) {
        return acc;
      }
    }
    if (!field.selector) {
      return acc;
    }

    const value = chooseValue(field, experienceOrder, educationOrder);
    if (value !== null && value !== undefined) {
      acc[field.selector] = value;
    }

    return acc;
  }, {});

  return {
    fills,
    summary: {
      requestedFields: fields.length,
      recommendedValues: Object.keys(fills).length,
    },
  };
}

module.exports = {
  fillFields,
};
