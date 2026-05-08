const dotenv = require('dotenv');
dotenv.config();

function requireApiKey(req, res, next) {
  const key = req.headers['x-api-key'] || req.query.api_key;
  if (!key || key !== process.env.IOT_API_KEY) return res.status(401).json({ error: 'Invalid API Key' });
  return next();
}

module.exports = { requireApiKey };
