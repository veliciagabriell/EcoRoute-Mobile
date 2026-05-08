const express = require('express');
const authController = require('../controllers/authController');
const tpsController = require('../controllers/tpsController');
const routesController = require('../controllers/routesController');
const reportsController = require('../controllers/reportsController');
const analyticsController = require('../controllers/analyticsController');
const iotController = require('../controllers/iotController');
const healthController = require('../controllers/healthController');

const { authRequired } = require('../middleware/auth');
const { requireApiKey } = require('../middleware/apiKey');
const { validateBody } = require('../middleware/validate');
const { loginSchema, iotDataSchema } = require('../utils/validators');
const { permit } = require('../utils/roles');

const router = express.Router();

// Auth
router.post('/auth/login', validateBody(loginSchema), authController.login);
router.post('/auth/refresh', authController.refresh);

// TPS
router.get('/tps', authRequired, tpsController.list);
router.get('/tps/:id', authRequired, tpsController.getOne);
router.get('/tps/:id/readings', authRequired, tpsController.getReadings);

// Routes
router.get('/routes/optimal', authRequired, permit('admin','officer'), routesController.optimalRoute);

// Reports
router.post('/reports', authRequired, reportsController.createReport);
router.get('/reports', authRequired, permit('admin'), reportsController.listReports);
router.patch('/reports/:id', authRequired, permit('admin'), reportsController.updateReport);

// Analytics
router.get('/analytics/trends', authRequired, permit('admin'), analyticsController.trends);

// IoT HTTP fallback
router.post('/iot/data', requireApiKey, validateBody(iotDataSchema), iotController.postData);

// System
router.get('/health', healthController.health);

module.exports = router;
