const admin = require('firebase-admin');
const dotenv = require('dotenv');
dotenv.config();

if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  try {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
  } catch (err) {
    console.error('Firebase init error', err);
  }
}

module.exports = admin;
