const serverless = require('serverless-http');
const app = require('../server');

// Export the serverless handler for Vercel
module.exports = serverless(app);
