const http = require('http');
const { handleRequest } = require('./controllers/fillController');

const PORT = 3000;
const HOST = '127.0.0.1';

console.log('Local agent starting on port', PORT);

const server = http.createServer(handleRequest);

server.listen(PORT, HOST, () => {
  console.log(`Local agent listening at http://${HOST}:${PORT}`);
});

server.listen(PORT, HOST, () => {
  console.log(`Local agent listening at http://${HOST}:${PORT}`);
});
  