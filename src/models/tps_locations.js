const pool = require('../config/db');

class TPSLocations {
  /**
   * Ambil semua TPS
   */
  static async getAll(area = null) {
    try {
      let query = 'SELECT * FROM tps_locations';
      const params = [];
      
      if (area) {
        query += ' WHERE area = $1';
        params.push(area);
      }
      
      query += ' ORDER BY created_at DESC';
      const result = await pool.query(query, params);
      return result.rows;
    } catch (err) {
      console.error('[TPSLocations.getAll] Error:', err);
      throw err;
    }
  }

  /**
   * Ambil TPS berdasarkan ID
   */
  static async getById(id) {
    try {
      const result = await pool.query(
        'SELECT * FROM tps_locations WHERE id = $1',
        [id]
      );
      return result.rows[0];
    } catch (err) {
      console.error('[TPSLocations.getById] Error:', err);
      throw err;
    }
  }

  /**
   * Buat TPS baru
   */
  static async create(data) {
    try {
      const { name, latitude, longitude, container_height_cm, area } = data;
      const result = await pool.query(
        `INSERT INTO tps_locations (name, latitude, longitude, container_height_cm, area)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [name, latitude, longitude, container_height_cm, area]
      );
      return result.rows[0];
    } catch (err) {
      console.error('[TPSLocations.create] Error:', err);
      throw err;
    }
  }

  /**
   * Update TPS
   */
  static async update(id, data) {
    try {
      const { name, latitude, longitude, container_height_cm, area } = data;
      const result = await pool.query(
        `UPDATE tps_locations 
         SET name = COALESCE($1, name),
             latitude = COALESCE($2, latitude),
             longitude = COALESCE($3, longitude),
             container_height_cm = COALESCE($4, container_height_cm),
             area = COALESCE($5, area)
         WHERE id = $6
         RETURNING *`,
        [name, latitude, longitude, container_height_cm, area, id]
      );
      return result.rows[0];
    } catch (err) {
      console.error('[TPSLocations.update] Error:', err);
      throw err;
    }
  }

  /**
   * Hapus TPS
   */
  static async delete(id) {
    try {
      const result = await pool.query(
        'DELETE FROM tps_locations WHERE id = $1 RETURNING *',
        [id]
      );
      return result.rows[0];
    } catch (err) {
      console.error('[TPSLocations.delete] Error:', err);
      throw err;
    }
  }

  /**
   * Ambil TPS dengan latest sensor reading
   */
  static async getAllWithLatestReading() {
    try {
      const result = await pool.query(`
        SELECT 
          t.id,
          t.name,
          t.latitude,
          t.longitude,
          t.container_height_cm,
          t.area,
          t.created_at,
          sr.ammonia_ppm,
          sr.fullness_pct,
          sr.alert_level,
          sr.timestamp as last_reading_at
        FROM tps_locations t
        LEFT JOIN LATERAL (
          SELECT ammonia_ppm, fullness_pct, alert_level, timestamp
          FROM sensor_readings
          WHERE tps_id = t.id
          ORDER BY timestamp DESC
          LIMIT 1
        ) sr ON true
        ORDER BY t.created_at DESC
      `);
      return result.rows;
    } catch (err) {
      console.error('[TPSLocations.getAllWithLatestReading] Error:', err);
      throw err;
    }
  }

  /**
   * Get TPS statistics
   */
  static async getStatistics(tpsId) {
    try {
      const result = await pool.query(`
        SELECT 
          COUNT(*) as total_readings,
          AVG(ammonia_ppm) as avg_ammonia_ppm,
          MAX(ammonia_ppm) as max_ammonia_ppm,
          AVG(fullness_pct) as avg_fullness_pct,
          MAX(fullness_pct) as max_fullness_pct,
          CASE 
            WHEN alert_level = 'critical' THEN COUNT(*)
            ELSE 0
          END as critical_count,
          CASE 
            WHEN alert_level = 'warning' THEN COUNT(*)
            ELSE 0
          END as warning_count
        FROM sensor_readings
        WHERE tps_id = $1
        AND timestamp > NOW() - INTERVAL '24 hours'
      `, [tpsId]);
      return result.rows[0];
    } catch (err) {
      console.error('[TPSLocations.getStatistics] Error:', err);
      throw err;
    }
  }
}

module.exports = TPSLocations;
