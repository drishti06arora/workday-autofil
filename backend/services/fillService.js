const FieldMappingRepository = require('../database/fieldMappingRepository');
const {
  buildSearchText,
  buildSearchTexts,
  getDefaultBooleanAnswer,
  isPhoneExtensionField,
  buildWorkExperienceOrder,
  isWorkExperienceField,
  getWorkExperienceFieldType,
} = require('../utils/fieldUtils');

const repository = new FieldMappingRepository();

function chooseValue(field, experienceOrder = []) {
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

function fillFields(fields) {
  if (!Array.isArray(fields)) {
    throw new Error('`fields` must be an array');
  }

  const experienceOrder = buildWorkExperienceOrder(fields);
  const fills = fields.reduce((acc, field) => {
    if (!field.selector) {
      return acc;
    }

    const value = chooseValue(field, experienceOrder);
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
