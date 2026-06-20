const { hasTokenMatch, getWorkExperienceInstanceId } = require('../utils/fieldUtils');

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
    };

    this.experienceProfiles = [
      {
        company: 'WorkDay',
        title: 'Senior Software Engineer',
        location: 'Bengaluru, Karnataka',
        current: true,
        startMonth: '01',
        startYear: '2024',
        endMonth: '',
        endYear: '',
        description: 'This is a sample description for the current role at WorkDay, highlighting key responsibilities and achievements.',
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
      },
    ];

    this.mappings = [
      { key: 'education schoolname', value: 'Indian Institute of Technology' },
      { key: 'education fieldofstudy', value: 'Computer Science' },
      { key: 'webaddress url', value: 'https://www.workday.com' },
      { key: 'job title', value: 'Software Engineer' },
      { key: 'position', value: 'Software Engineer' },
      { key: 'company name', value: 'Workday Corp' },
      { key: 'employer', value: 'Workday Corp' },
      { key: 'location', value: 'Bengaluru, Karnataka' },
      { key: 'start date', value: '01/2020' },
      { key: 'end date', value: '06/2024' },
      { key: 'role description', value: 'This is a sample description for the current role at WorkDay, highlighting key responsibilities and achievements.',
      },
      { key: 'school name', value: 'Indian Institute of Technology' },
      { key: 'field of study', value: 'Computer Science' },
      { key: 'state', value: 'Karnataka' },
      { key: 'country', value: 'India' },
      { key: 'city', value: 'Bengaluru' },
    ];
  }

  findExpectedValue(searchTexts) {
    for (const searchText of searchTexts) {
      if (this.expectedFields[searchText]) {
        return this.expectedFields[searchText];
      }
    }

    for (const searchText of searchTexts) {
      for (const [key, value] of Object.entries(this.expectedFields)) {
        if (searchText.includes(key) || key.includes(searchText)) {
          return value;
        }
      }
    }

    return null;
  }

  getFieldMapping(searchText) {
    for (const mapping of this.mappings) {
      if (hasTokenMatch(searchText, mapping.key)) {
        return mapping.value;
      }
    }
    return null;
  }

  getExperienceProfile(field, experienceOrder) {
    const id = getWorkExperienceInstanceId(field);
    if (id === null) {
      return null;
    }

    const position = experienceOrder.indexOf(id);
    if (position === -1) {
      return null;
    }

    return this.experienceProfiles[position] || this.experienceProfiles[this.experienceProfiles.length - 1];
  }
}

module.exports = FieldMappingRepository;
