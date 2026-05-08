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

MQTT
- Ensure an MQTT broker (Mosquitto) is reachable at MQTT_BROKER_URL.

Notes
- This is a starter implementation implementing core endpoints and MQTT handling per spec.
# EcoRoute-Mobile