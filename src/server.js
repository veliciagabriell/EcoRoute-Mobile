const app = require('./app');
const dotenv = require('dotenv');
dotenv.config();

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`EcoRoute API listening on ${port}`);
});

// Jangan biarkan server crash karena unhandled rejection
process.on('unhandledRejection', (reason, promise) => {
  console.error('[Server] Unhandled Rejection:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('[Server] Uncaught Exception:', err.message);
});
