const { sendJson, parseJsonBody } = require('../utils/httpUtils');
const { fillFields } = require('../services/fillService');

/**
 * Handle all incoming HTTP requests for the local agent.
 * Supports OPTIONS for CORS, GET /ping for health checks, and POST /fill for field autofill requests.
 * Replies with JSON responses and appropriate HTTP status codes.
 */
async function handleRequest(req, res) {
  console.log('🔥 REQUEST RECEIVED');

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
      const result = fillFields(fields);
      sendJson(res, 200, result);
    } catch (error) {
      sendJson(res, 400, { error: error.message || 'Invalid JSON body' });
    }
    return;
  }

  sendJson(res, 404, { error: 'Not found' });
}

module.exports = {
  handleRequest,
};
