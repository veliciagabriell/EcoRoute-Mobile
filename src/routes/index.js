const express = require('express');
const authController = require('../controllers/authController');
const tpsController = require('../controllers/tpsController');
const routesController = require('../controllers/routesController');
const reportsController = require('../controllers/reportsController');
const analyticsController = require('../controllers/analyticsController');
const iotController = require('../controllers/iotController');
const sensorController = require('../controllers/sensorController');
const healthController = require('../controllers/healthController');
const ecobotController = require('../controllers/ecobotController');

const { authRequired } = require('../middleware/auth');
const { requireApiKey } = require('../middleware/apiKey');
const { validateBody } = require('../middleware/validate');
const { registerSchema, loginSchema, iotDataSchema } = require('../utils/validators');
const { permit } = require('../utils/roles');

const router = express.Router();

// Auth
router.post('/auth/register', validateBody(registerSchema), authController.register);
router.post('/auth/login', validateBody(loginSchema), authController.login);
router.post('/auth/refresh', authController.refresh);
router.get('/auth/me', authRequired, authController.me);

// TPS
router.get('/tps', authRequired, tpsController.list);
router.get('/tps/nearby', authRequired, tpsController.getNearby);
router.get('/tps/with-readings', authRequired, tpsController.getAllWithReadings);
router.post('/tps', authRequired, permit('admin'), tpsController.create);
router.get('/tps/:id', authRequired, tpsController.getOne);
router.get('/tps/:id/readings', authRequired, tpsController.getReadings);
router.get('/tps/:id/statistics', authRequired, tpsController.getStatistics);
router.put('/tps/:id', authRequired, permit('admin'), tpsController.update);
router.delete('/tps/:id', authRequired, permit('admin'), tpsController.deleteTps);

// Sensors
router.get('/sensors/status', authRequired, sensorController.getLatestStatus);
router.get('/sensors/tps/:tps_id/alert-history', authRequired, sensorController.getTpsAlertHistory);

// Routes
router.get('/routes/optimal', authRequired, permit('admin','petugas'), routesController.optimalRoute);

// Reports
router.post('/reports', authRequired, reportsController.createReport);
router.get('/reports', authRequired, permit('admin'), reportsController.listReports);
router.patch('/reports/:id', authRequired, permit('admin'), reportsController.updateReport);

// Analytics
router.get('/analytics/trends', authRequired, permit('admin'), analyticsController.trends);

// IoT HTTP fallback
router.post('/iot/data', requireApiKey, validateBody(iotDataSchema), iotController.postData);

// EcoBot
router.post('/ecobot/chat', ecobotController.chat);
router.post('/ecobot/chat/stream', ecobotController.chatStream);
router.get('/ecobot/health', ecobotController.ecobotHealth);

// System
router.get('/health', healthController.health);

module.exports = router;
