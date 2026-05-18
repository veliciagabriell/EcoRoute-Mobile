const TPSLocations = require('../models/tps_locations');
const sensorModel = require('../models/sensor_readings');
const redis = require('../config/redis');

/**
 * @swagger
 * /tps:
 *   get:
 *     tags: [TPS]
 *     summary: Dapatkan semua TPS
 *     parameters:
 *       - in: query
 *         name: area
 *         schema:
 *           type: string
 *         description: Filter berdasarkan area (opsional)
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Daftar TPS berhasil diambil
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/TPS'
 *                 count:
 *                   type: integer
 *       401:
 *         description: Unauthorized
 */
async function list(req, res, next) {
  try {
    const { area } = req.query;
    const all = await TPSLocations.getAll(area);
    // augment with latest from redis or db
    const result = [];
    for (const t of all) {
      const cache = await redis.get(`latest_reading:${t.id}`);
      let latest = null;
      if (cache) latest = JSON.parse(cache);
      else latest = await sensorModel.getLatestByTps(t.id);
      result.push({ tps: t, latestReading: latest });
    }
    res.json({ data: result, count: result.length });
  } catch (err) {
    next(err);
  }
}

/**
 * @swagger
 * /tps/with-readings:
 *   get:
 *     tags: [TPS]
 *     summary: Dapatkan semua TPS dengan pembacaan sensor terbaru
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Data berhasil diambil
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/TPSWithReading'
 *                 count:
 *                   type: integer
 *       401:
 *         description: Unauthorized
 */
async function getAllWithReadings(req, res, next) {
  try {
    const tpsList = await TPSLocations.getAllWithLatestReading();
    res.json({ data: tpsList, count: tpsList.length });
  } catch (err) {
    next(err);
  }
}

/**
 * @swagger
 * /tps/{id}:
 *   get:
 *     tags: [TPS]
 *     summary: Dapatkan detail TPS spesifik
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Detail TPS ditemukan
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tps:
 *                   $ref: '#/components/schemas/TPS'
 *                 latestReading:
 *                   $ref: '#/components/schemas/SensorReading'
 *       404:
 *         description: TPS tidak ditemukan
 *       401:
 *         description: Unauthorized
 */
async function getOne(req, res, next) {
  try {
    const { id } = req.params;
    const tps = await TPSLocations.getById(id);
    if (!tps) return res.status(404).json({ error: 'TPS tidak ditemukan' });
    
    const cache = await redis.get(`latest_reading:${tps.id}`);
    let latest = null;
    if (cache) latest = JSON.parse(cache);
    else latest = await sensorModel.getLatestByTps(tps.id);
    res.json({ tps, latestReading: latest });
  } catch (err) {
    next(err);
  }
}

/**
 * @swagger
 * /tps/{id}/readings:
 *   get:
 *     tags: [TPS]
 *     summary: Dapatkan pembacaan sensor dalam rentang waktu
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Waktu mulai (ISO 8601)
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Waktu selesai (ISO 8601)
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Pembacaan sensor ditemukan
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/SensorReading'
 *                 count:
 *                   type: integer
 */
async function getReadings(req, res, next) {
  try {
    const { id } = req.params;
    const { from, to } = req.query;
    const fromTS = from ? new Date(from).toISOString() : new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString();
    const toTS = to ? new Date(to).toISOString() : new Date().toISOString();
    const rows = await sensorModel.getByTpsInRange(id, fromTS, toTS);
    res.json({ data: rows, count: rows.length });
  } catch (err) {
    next(err);
  }
}

/**
 * @swagger
 * /tps/{id}/statistics:
 *   get:
 *     tags: [TPS]
 *     summary: Dapatkan statistik TPS 24 jam terakhir
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Statistik ditemukan
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tps:
 *                   $ref: '#/components/schemas/TPS'
 *                 statistics:
 *                   type: object
 */
async function getStatistics(req, res, next) {
  try {
    const { id } = req.params;
    const tps = await TPSLocations.getById(id);
    
    if (!tps) {
      return res.status(404).json({ error: 'TPS tidak ditemukan' });
    }
    
    const stats = await TPSLocations.getStatistics(id);
    res.json({
      tps,
      statistics: stats
    });
  } catch (err) {
    next(err);
  }
}

/**
 * @swagger
 * /tps/nearby:
 *   get:
 *     tags: [TPS]
 *     summary: Dapatkan TPS terdekat
 *     parameters:
 *       - in: query
 *         name: lat
 *         required: true
 *         schema:
 *           type: number
 *       - in: query
 *         name: lng
 *         required: true
 *         schema:
 *           type: number
 *       - in: query
 *         name: radiusKm
 *         schema:
 *           type: number
 *           default: 5
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: area
 *         schema:
 *           type: string
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: TPS terdekat berhasil diambil
 */
async function getNearby(req, res, next) {
  try {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    const radiusKm = Number(req.query.radiusKm || 5);
    const limit = Number(req.query.limit || 10);
    const area = req.query.area || null;

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return res.status(400).json({ error: 'lat dan lng wajib diisi' });
    }

    const tpsList = await TPSLocations.getNearby({ lat, lng, radiusKm, limit, area });
    const result = [];
    for (const t of tpsList) {
      const cache = await redis.get(`latest_reading:${t.id}`);
      let latest = null;
      if (cache) latest = JSON.parse(cache);
      else latest = await sensorModel.getLatestByTps(t.id);
      result.push({ tps: t, latestReading: latest, distance_km: t.distance_km });
    }

    const priority = (reading) => {
      const level = reading?.alert_level || 'normal';
      if (level === 'critical') return 3;
      if (level === 'warning') return 2;
      return 1;
    };

    result.sort((a, b) => {
      const pa = priority(a.latestReading);
      const pb = priority(b.latestReading);
      if (pa !== pb) return pb - pa;
      return (a.distance_km || 0) - (b.distance_km || 0);
    });

    res.json({ data: result, count: result.length });
  } catch (err) {
    next(err);
  }
}

/**
 * @swagger
 * /tps:
 *   post:
 *     tags: [TPS]
 *     summary: Buat TPS baru (admin only)
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - latitude
 *               - longitude
 *               - container_height_cm
 *             properties:
 *               name:
 *                 type: string
 *                 example: "TPS Blok A"
 *               latitude:
 *                 type: number
 *                 example: -6.225144
 *               longitude:
 *                 type: number
 *                 example: 106.862278
 *               container_height_cm:
 *                 type: integer
 *                 example: 100
 *               area:
 *                 type: string
 *                 example: "Jakarta Timur"
 *     responses:
 *       201:
 *         description: TPS berhasil dibuat
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TPS'
 *       400:
 *         description: Validasi gagal
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - hanya admin
 */
async function create(req, res, next) {
  try {
    const { name, latitude, longitude, container_height_cm, area } = req.body;
    
    // Validation
    if (!name || latitude === undefined || longitude === undefined || !container_height_cm) {
      return res.status(400).json({ 
        error: 'name, latitude, longitude, container_height_cm harus diisi' 
      });
    }
    
    const newTps = await TPSLocations.create({
      name,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      container_height_cm: parseInt(container_height_cm),
      area: area || null
    });
    
    res.status(201).json(newTps);
  } catch (err) {
    next(err);
  }
}

/**
 * @swagger
 * /tps/{id}:
 *   put:
 *     tags: [TPS]
 *     summary: Update TPS (admin only)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *               container_height_cm:
 *                 type: integer
 *               area:
 *                 type: string
 *     responses:
 *       200:
 *         description: TPS berhasil diupdate
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TPS'
 *       404:
 *         description: TPS tidak ditemukan
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
async function update(req, res, next) {
  try {
    const { id } = req.params;
    const { name, latitude, longitude, container_height_cm, area } = req.body;
    
    const tps = await TPSLocations.getById(id);
    if (!tps) {
      return res.status(404).json({ error: 'TPS tidak ditemukan' });
    }
    
    const updatedTps = await TPSLocations.update(id, {
      name,
      latitude: latitude !== undefined ? parseFloat(latitude) : undefined,
      longitude: longitude !== undefined ? parseFloat(longitude) : undefined,
      container_height_cm: container_height_cm !== undefined ? parseInt(container_height_cm) : undefined,
      area
    });
    
    res.json(updatedTps);
  } catch (err) {
    next(err);
  }
}

/**
 * @swagger
 * /tps/{id}:
 *   delete:
 *     tags: [TPS]
 *     summary: Hapus TPS (admin only)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: TPS berhasil dihapus
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/TPS'
 *       404:
 *         description: TPS tidak ditemukan
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
async function deleteTps(req, res, next) {
  try {
    const { id } = req.params;
    
    const tps = await TPSLocations.getById(id);
    if (!tps) {
      return res.status(404).json({ error: 'TPS tidak ditemukan' });
    }
    
    const deletedTps = await TPSLocations.delete(id);
    res.json({ message: 'TPS berhasil dihapus', data: deletedTps });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  list,
  getAllWithReadings,
  getOne,
  getReadings,
  getStatistics,
  getNearby,
  create,
  update,
  deleteTps
};
