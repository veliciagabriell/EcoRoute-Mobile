# EcoRoute Backend

Backend API for EcoRoute - IoT smart waste management system.

Features:
- Express.js API
- PostgreSQL (primary)
- Redis (caching)
- MQTT client for device messages
- JWT auth (access + refresh)
- FCM push notifications

Quick setup
1. Copy `.env.example` to `.env` and fill credentials.
2. Install dependencies: npm install
3. Start in development: npm run dev

Database
- Create the PostgreSQL database and run the schema in `src/db/schema.sql`.
- Seed TPS data (ITB Ganesha + Tamansari) with: `npm run seed-db`.

MQTT
- Ensure an MQTT broker (Mosquitto) is reachable at MQTT_BROKER_URL.

Route Optimization (Greedy + OSRM)
- Endpoint: GET /api/routes/optimal (role: admin, petugas)
- Query params: area, startLat, startLng, endLat, endLng, withMaps=true
- Uses a greedy nearest-neighbor algorithm over TPS coordinates.
- withMaps=true will fetch route geometry from the free OSRM public server.

Notes
- This is a starter implementation implementing core endpoints and MQTT handling per spec.
# EcoRoute-Mobile