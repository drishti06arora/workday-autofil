const { hasTokenMatch, getWorkExperienceInstanceId, getEducationInstanceId, normalizeString } = require('../utils/fieldUtils');

/**
 * Repository for expected field values and mapped text values.
 * This class centralizes field lookup logic for generic autofill behavior.
 */
class FieldMappingRepository {
  constructor() {
    this.expectedFields = {
      'first name': 'Jane',
      'given name': 'Jane',
      'last name': 'Doe',
      'surname': 'Doe',
      'family name': 'Doe',
      email: 'jane.doe@gmail.com',
      phone: '9876543210',
      mobile: '9876543210',
      'cell phone': '9876543210',
      'street address': '',
      address: 'House/Appartment number',
      city: 'City',
      state: 'State',
      region: 'Region',
      'zip code': '989898',
      'postal code': '989898',
      country: 'India',
      url: 'https://www.example.com',
      socialNetworkAccounts: "https://www.linkedin.com/in/janedoe",
    };

    this.experienceProfiles = [
      {
        company: 'WorkDay',
        title: 'Senior Software Engineer',
        location: 'Bengaluru, Karnataka',
        current: true,
        startMonth: '01',
        startYear: '2024',
        endMonth: '03',
        endYear: '2026',
        description: 'This is a sample description for the current role at WorkDay, highlighting key responsibilities and achievements.',
        roleDescription: 'This is a sample description for the current role at WorkDay, highlighting key responsibilities and achievements.',
      },
      {
        company: 'Nvidia',
        title: 'Software Engineer',
        location: 'Bengaluru, Karnataka',
        current: false,
        startMonth: '05',
        startYear: '2020',
        endMonth: '12',
        endYear: '2023',
        description: 'This is a sample description for the current role at Nvidia, highlighting key responsibilities and achievements.',
        roleDescription: 'This is a sample description for the current role at Nvidia, highlighting key responsibilities and achievements.',
      },
      {
        company: 'Google',
        title: 'Software Engineer II',
        location: 'Hyderabad, Telangana',
        current: false,
        startMonth: '03',
        startYear: '2018',
        endMonth: '04',
        endYear: '2020',
        description: 'This is a sample description for the current role at Google, highlighting key responsibilities and achievements.',
        roleDescription: 'This is a sample description for the current role at Google, highlighting key responsibilities and achievements.',
      },
      {
        company: 'Microsoft',
        title: 'Software Engineer',
        location: 'Hyderabad, Telangana',
        current: false,
        startMonth: '02',
        startYear: '2016',
        endMonth: '02',
        endYear: '2018',
        description: 'This is a sample description for the current role at Microsoft, highlighting key responsibilities and achievements.',
        roleDescription: 'This is a sample description for the current role at Microsoft, highlighting key responsibilities and achievements.',
      },
    ];

    // Fixed education dataset for grouped education sections.
    // Only these predefined education profiles are used when filling education entries.
    this.educationProfiles = [
      {
        schoolName: 'Indian Institute of Technology',
        fieldOfStudy: 'Computer Science',
        degree: 'Bachelor of Technology',
        startMonth: '08',
        startYear: '2015',
        endMonth: '05',
        endYear: '2019',
      },
    ];

    // Fallback mappings for individual fields and non-grouped inputs.
    // These are not the same as the structured profile dataset, but they provide values
    // when a field cannot be matched to an education or experience profile.
    this.mappings = [
      // Education-specific labels.
      { key: 'education schoolname', value: 'Indian Institute of Technology' },
      { key: 'education fieldofstudy', value: 'Computer Science' },

      // Work experience / profile-related labels.
      { key: 'webaddress url', value: 'https://www.workday.com' },
      { key: 'job title', value: 'Software Engineer' },
      { key: 'position', value: 'Software Engineer' },
      { key: 'company name', value: 'Workday Corp' },
      { key: 'employer', value: 'Workday Corp' },
      { key: 'location', value: 'Bengaluru, Karnataka' },
      { key: 'start date', value: '01/2020' },
      { key: 'end date', value: '06/2024' },
      {
        key: 'role description',
        value: 'This is a sample description for the current role at WorkDay, highlighting key responsibilities and achievements.',
      },

      // Generic education and address labels.
      { key: 'school name', value: 'Indian Institute of Technology' },
      { key: 'field of study', value: 'Computer Science' },
      { key: 'state', value: 'Karnataka' },
      { key: 'country', value: 'India' },
      { key: 'city', value: 'Bengaluru' },
    ];
  }

  /**
   * Search expected values by normalized search text tokens.
   * Returns a default answer for common field names such as name, email, phone, and address.
   */
  findExpectedValue(searchTexts) {
    const normalizedSearchTexts = searchTexts.map(normalizeString);

    for (const searchText of normalizedSearchTexts) {
      if (this.expectedFields[searchText]) {
        return this.expectedFields[searchText];
      }
    }

    for (const searchText of normalizedSearchTexts) {
      for (const [key, value] of Object.entries(this.expectedFields)) {
        const normalizedKey = normalizeString(key);
        if (searchText.includes(normalizedKey) || normalizedKey.includes(searchText)) {
          return value;
        }
      }
    }

    return null;
  }

  /**
   * Lookup a mapped field value using token matching between the field text and mapping keys.
   */
  getFieldMapping(searchText) {
    for (const mapping of this.mappings) {
      if (hasTokenMatch(searchText, mapping.key)) {
        return mapping.value;
      }
    }
    return null;
  }

  /**
   * Return the experience profile that matches a work experience field group.
   * The order is derived from the form fields so the correct profile is selected for repeated work history sections.
   */
  getExperienceProfile(field, experienceOrder) {
    const id = getWorkExperienceInstanceId(field);
    if (id === null) {
      return null;
    }

    const position = experienceOrder.indexOf(id);
    if (position === -1 || position >= this.experienceProfiles.length) {
      return null;
    }

    return this.experienceProfiles[position];
  }

  /**
   * Return the total number of defined experience profiles.
   * This controls how many work experience sections will be filled.
   */
  getExperienceProfileCount() {
    return this.experienceProfiles.length;
  }

  /**
   * Return the education profile that matches an education field group.
   * Extra education sections beyond the configured profiles are skipped.
   */
  getEducationProfile(field, educationOrder) {
    const id = getEducationInstanceId(field);
    if (id === null) {
      return null;
    }

    const position = educationOrder.indexOf(id);
    if (position === -1 || position >= this.educationProfiles.length) {
      return null;
    }

    return this.educationProfiles[position];
  }

  /**
   * Return the total number of defined education profiles.
   */
  getEducationProfileCount() {
    return this.educationProfiles.length;
  }
}

module.exports = FieldMappingRepository;
