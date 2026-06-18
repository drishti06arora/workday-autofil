const http = require('http');

const PORT = process.env.PORT || 3000;
const HOST = '127.0.0.1';

// Expected fields memory - no thinking needed, direct values
const expectedFieldsMemory = {
  'first name': 'Jane',
  'given name': 'Jane',
  'last name': 'Doe',
  'surname': 'Doe',
  'email': 'jane.doe@example.com',
  'phone': '555-123-4567',
  'mobile': '555-123-4567',
  'cell phone': '555-123-4567',
  'street address': '123 Main St.',
  'address': '123 Main St.',
  'city': 'Austin',
  'state': 'TX',
  'region': 'TX',
  'zip code': '78701',
  'postal code': '78701',
  'country': 'United States',
  'company': 'Workday Corp',
  'employer': 'Workday Corp',
  'job title': 'Software Engineer',
  'position': 'Software Engineer',
  'role': 'Software Engineer',
  'department': 'Engineering',
  'start date': new Date().toISOString().slice(0, 10),
  'date of birth': '1990-01-15',
};

const normalizeKey = (value = '') =>
  value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const chooseValue = (field) => {
  const searchTexts = [field.name, field.id, field.label, field.placeholder]
    .filter(Boolean)
    .map(normalizeKey);

  if (field.type === 'checkbox') return true;
  if (field.type === 'radio') return field.value || true;
  if (field.type === 'select' && field.value) return field.value;

  // Direct lookup in expected fields
  for (const text of searchTexts) {
    if (expectedFieldsMemory.hasOwnProperty(text)) {
      return expectedFieldsMemory[text];
    }
  }

  // Fallback: partial match
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

      const fills = fields.reduce((acc, field) => {
        if (!field.selector) return acc;
        const value = chooseValue(field);
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
