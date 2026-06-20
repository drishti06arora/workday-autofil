const http = require('http');

const PORT = process.env.PORT || 3000;
const HOST = '127.0.0.1';

const expectedFieldsMemory = {
  'first name': 'Jane',
  'given name': 'Jane',
  'last name': 'Doe',
  'surname': 'Doe',
  'family name': 'Doe',
  'email': 'jane.doe@gmail.com',
  'phone': '9876543210',
  'mobile': '9876543210',
  'cell phone': '9876543210',
  'street address': '',
  'address': 'House/Appartment number',
  'city': 'City',
  'state': 'State',
  'region': 'Region',
  'zip code': '989898',
  'postal code': '989898',
  'country': 'India',
};

const experienceProfiles = [
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

const normalizeString = (value = '') =>
  value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[-_]+/g, ' ')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\b\d+\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const normalizeDynamicKey = (value = '') =>
  value
    .toString()
    .trim()
    .replace(/(^|[-_])\d+([_-]|$)/g, '$1$2')
    .replace(/[-_]{2,}/g, '--')
    .replace(/(^[-_]+|[-_]+$)/g, '');

const tokenize = (value = '') =>
  normalizeString(value)
    .split(' ')
    .filter(Boolean);

const hasTokenMatch = (text, key) => {
  const textTokens = new Set(tokenize(text));
  return tokenize(key).every((token) => textTokens.has(token));
};

const buildSearchTexts = (field) => {
  const idKey = normalizeDynamicKey(field.id || '');
  return [idKey, field.name, field.label, field.placeholder]
    .filter(Boolean)
    .map(normalizeString)
    .filter(Boolean);
};

const buildSearchText = (field) =>
  normalizeString(
    [normalizeDynamicKey(field.id || ''), field.name, field.label, field.placeholder]
      .filter(Boolean)
      .join(' ')
  );

const isPhoneExtensionField = (field) => {
  const searchText = buildSearchText(field);
  return /\b(extension|ext)(?:\.|\b)/.test(searchText) && /\b(phone|tel)\b/.test(searchText);
};

const getDefaultBooleanAnswer = (field) => {
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
};

const getWorkExperienceInstanceId = (field) => {
  const source = String(field.id || field.selector || field.name || '');
  const match = source.match(/workExperience-(\d+)/i);
  return match ? Number(match[1]) : null;
};

const buildWorkExperienceOrder = (fields) => {
  return Array.from(
    new Set(
      fields
        .map(getWorkExperienceInstanceId)
        .filter((id) => id !== null)
    )
  ).sort((a, b) => b - a);
};

const isWorkExperienceField = (field) => {
  const searchText = buildSearchText(field);
  return /\bworkexperience\b/.test(searchText) || /workExperience-/i.test(field.id || '');
};

const getWorkExperienceFieldType = (field) => {
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
};

const getExperienceProfileForField = (field, experienceOrder) => {
  const id = getWorkExperienceInstanceId(field);
  if (id === null) return null;
  const position = experienceOrder.indexOf(id);
  if (position === -1) return null;
  return experienceProfiles[position] || experienceProfiles[experienceProfiles.length - 1];
};

const getFieldMapping = (field, experienceOrder = []) => {
  const searchText = buildSearchText(field);

  if (isWorkExperienceField(field)) {
    const profile = getExperienceProfileForField(field, experienceOrder);
    const fieldType = getWorkExperienceFieldType(field);
    if (profile && fieldType) {
      switch (fieldType) {
        case 'jobTitle':
          return profile.title;
        case 'companyName':
          return profile.company;
        case 'location':
          return profile.location;
        case 'currentlyWorkHere':
          return profile.current;
        case 'roleDescription':
          return profile.description;
        case 'startMonth':
          return profile.startMonth;
        case 'startYear':
          return profile.startYear;
        case 'endMonth':
          return profile.endMonth;
        case 'endYear':
          return profile.endYear;
        default:
          break;
      }
    }
  }

  const mappings = [
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
    { key: 'role description', value: 'This is a sample description for the current role at WorkDay, highlighting key responsibilities and achievements.' },
    { key: 'school name', value: 'Indian Institute of Technology' },
    { key: 'field of study', value: 'Computer Science' },
    { key: 'state', value: 'Karnataka' },
    { key: 'country', value: 'India' },
    { key: 'city', value: 'Bengaluru' },
  ];

  for (const mapping of mappings) {
    if (hasTokenMatch(searchText, mapping.key)) {
      return mapping.value;
    }
  }

  return null;
};

const chooseValue = (field, experienceOrder = []) => {
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
  const booleanAnswer = getDefaultBooleanAnswer(field);
  if (booleanAnswer !== null) {
    if (field.type === 'checkbox') {
      return booleanAnswer.toLowerCase() === 'yes';
    }

    return booleanAnswer;
  }

  if (field.type === 'checkbox') {
    const fieldText = buildSearchText(field);
    if (/(agree|consent|accept|authorize|same as)/.test(fieldText)) {
      return true;
    }
    return null;
  }

  if (field.type === 'radio') {
    const answer = getDefaultBooleanAnswer(field);
    if (answer !== null) {
      return answer;
    }
    return field.value || null;
  }

  if (field.type === 'select') {
    const mappedValue = getFieldMapping(field);
    if (mappedValue) {
      return mappedValue;
    }
    if (field.value) {
      return field.value;
    }
  }

  for (const text of searchTexts) {
    if (expectedFieldsMemory.hasOwnProperty(text)) {
      return expectedFieldsMemory[text];
    }
  }

  const mappedValue = getFieldMapping(field);
  if (mappedValue) {
    return mappedValue;
  }

  for (const text of searchTexts) {
    for (const [memKey, memValue] of Object.entries(expectedFieldsMemory)) {
      if (text.includes(memKey) || memKey.includes(text)) {
        return memValue;
      }
    }
  }

  return null;
};

const sendJson = (res, statusCode, data) => {
  const body = JSON.stringify(data, null, 2);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(body);
};

const parseJsonBody = (req) =>
  new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(body || '{}'));
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    sendJson(res, 204, {});
    return;
  }

  if (req.method === 'GET' && req.url === '/ping') {
    sendJson(res, 200, { status: 'ok' });
    return;
  }

  if (req.method === 'POST' && req.url === '/fill') {
    try {
      const { fields } = await parseJsonBody(req);
      if (!Array.isArray(fields)) {
        sendJson(res, 400, { error: '`fields` must be an array' });
        return;
      }

      const experienceOrder = buildWorkExperienceOrder(fields);
      const fills = fields.reduce((acc, field) => {
        if (!field.selector) return acc;
        const value = chooseValue(field, experienceOrder);
        if (value !== null && value !== undefined) {
          acc[field.selector] = value;
        }
        return acc;
      }, {});

      sendJson(res, 200, {
        fills,
        summary: {
          requestedFields: fields.length,
          recommendedValues: Object.keys(fills).length,
        },
      });
    } catch (error) {
      sendJson(res, 400, { error: error.message || 'Invalid JSON body' });
    }
    return;
  }

  sendJson(res, 404, { error: 'Not found' });
});

server.listen(PORT, HOST, () => {
  console.log(`Local agent listening at http://${HOST}:${PORT}`);
});
