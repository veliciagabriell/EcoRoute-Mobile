const express = require('express');
const dotenv = require('dotenv');
dotenv.config();
const routes = require('./routes');
const rateLimiter = require('./middleware/rateLimiter');
require('./services/mqttHandler'); // initialize mqtt handlers
const cors = require('cors');

const app = express();
app.use(rateLimiter);
app.use(express.json());
app.use(cors());

app.use('/api', routes);

// generic error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
});

module.exports = app;
