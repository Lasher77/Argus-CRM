const http = require('http');
const app = require('../src/app');
const { seedTestData } = require('../tests/utils/testData');

const PORT = Number(process.env.PORT) || 3000;

seedTestData();

const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`Testserver läuft auf http://localhost:${PORT}`);
});

const shutdown = () => {
  server.close(() => {
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
