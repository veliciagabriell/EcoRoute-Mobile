const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'EcoRoute API',
      version: '1.0.0',
      description:
        'REST API untuk aplikasi EcoRoute — sistem manajemen sampah berbasis IoT. ' +
        'Mendukung autentikasi JWT, manajemen TPS, laporan warga, analitik, dan integrasi IoT.',
      contact: {
        name: 'EcoRoute Team',
        email: 'admin@ecoroute.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000/api',
        description: 'Development Server',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Masukkan JWT access token. Format: Bearer <token>',
        },
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'x-api-key',
          description: 'API key untuk endpoint IoT',
        },
      },
      schemas: {
        // ─── Auth ──────────────────────────────────────────────
        RegisterRequest: {
          type: 'object',
          required: ['name', 'email', 'password'],
          properties: {
            name: {
              type: 'string',
              minLength: 2,
              maxLength: 100,
              example: 'Budi Santoso',
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'budi@example.com',
            },
            password: {
              type: 'string',
              minLength: 8,
              example: 'rahasia123',
            },
            role: {
              type: 'string',
              enum: ['umum', 'petugas', 'admin'],
              default: 'umum',
              example: 'umum',
              description: 'umum: Pengguna umum, petugas: Petugas pengumpul sampah, admin: Administrator',
            },
          },
        },
        RegisterResponse: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'Registrasi berhasil' },
            user: { $ref: '#/components/schemas/UserProfile' },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'budi@example.com',
            },
            password: {
              type: 'string',
              example: 'rahasia123',
            },
          },
        },
        LoginResponse: {
          type: 'object',
          properties: {
            access_token: {
              type: 'string',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            },
            refresh_token: {
              type: 'string',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            },
            user: { $ref: '#/components/schemas/UserProfile' },
          },
        },
        RefreshRequest: {
          type: 'object',
          required: ['refresh_token'],
          properties: {
            refresh_token: {
              type: 'string',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            },
          },
        },
        RefreshResponse: {
          type: 'object',
          properties: {
            access_token: {
              type: 'string',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            },
          },
        },
        // ─── User ──────────────────────────────────────────────
        UserProfile: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid', example: 'a1b2c3d4-...' },
            name: { type: 'string', example: 'Budi Santoso' },
            email: { type: 'string', format: 'email', example: 'budi@example.com' },
            role: {
              type: 'string',
              enum: ['umum', 'petugas', 'admin'],
              example: 'umum',
            },
            work_area: { type: 'string', nullable: true, example: 'Bandung Barat' },
            fcm_token: { type: 'string', nullable: true, example: null },
            created_at: {
              type: 'string',
              format: 'date-time',
              example: '2026-05-18T10:00:00.000Z',
            },
          },
        },
        // ─── TPS ────────────────────────────────────────────────
        TPS: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string', example: 'TPS Blok A - Kelurahan Jatinegara' },
            latitude: { type: 'number', format: 'decimal', example: -6.225144 },
            longitude: { type: 'number', format: 'decimal', example: 106.862278 },
            container_height_cm: { type: 'integer', example: 100 },
            area: { type: 'string', nullable: true, example: 'Jakarta Timur' },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        SensorReading: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            tps_id: { type: 'string', format: 'uuid' },
            device_id: { type: 'string', example: 'DEVICE_001' },
            ammonia_ppm: { type: 'number', format: 'decimal', example: 45.5 },
            fullness_pct: { type: 'number', format: 'decimal', example: 75.2 },
            alert_level: { type: 'string', enum: ['normal', 'warning', 'critical'] },
            timestamp: { type: 'string', format: 'date-time' },
          },
        },
        TPSWithReading: {
          type: 'object',
          properties: {
            tps: { $ref: '#/components/schemas/TPS' },
            latestReading: { $ref: '#/components/schemas/SensorReading' },
          },
        },
        RouteStop: {
          type: 'object',
          properties: {
            order: { type: 'integer', example: 1 },
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string', example: 'TPS Tamansari' },
            latitude: { type: 'number', example: -6.90035 },
            longitude: { type: 'number', example: 107.60657 },
            latestReading: { $ref: '#/components/schemas/SensorReading' },
            distanceFromPrevKm: { type: 'number', example: 0.8 },
          },
        },
        RouteMap: {
          type: 'object',
          properties: {
            distance_m: { type: 'number', example: 4210 },
            duration_s: { type: 'number', example: 1020 },
            geometry: {
              type: 'object',
              description: 'GeoJSON LineString from OSRM',
            },
            legs: {
              type: 'array',
              items: { type: 'object' },
            },
            error: { type: 'string', nullable: true },
            message: { type: 'string', nullable: true },
          },
        },
        RouteResponse: {
          type: 'object',
          properties: {
            start: {
              type: 'object',
              properties: {
                lat: { type: 'number', example: -6.89148 },
                lng: { type: 'number', example: 107.6107 },
              },
            },
            end: {
              type: 'object',
              properties: {
                lat: { type: 'number', example: -6.90035 },
                lng: { type: 'number', example: 107.60657 },
              },
            },
            totalDistanceKm: { type: 'number', example: 12.4 },
            stops: {
              type: 'array',
              items: { $ref: '#/components/schemas/RouteStop' },
            },
            maps: { $ref: '#/components/schemas/RouteMap' },
          },
        },
        // ─── Error ─────────────────────────────────────────────
        ErrorResponse: {
          type: 'object',
          properties: {
            error: { type: 'string', example: 'Pesan error' },
          },
        },
      },
    },
    tags: [
      { name: 'Auth', description: 'Registrasi, login, refresh token, dan profil pengguna' },
      { name: 'TPS', description: 'Data Tempat Pembuangan Sampah dan sensor readings' },
      { name: 'Routes', description: 'Rute pengambilan sampah optimal' },
      { name: 'Reports', description: 'Laporan dari warga' },
      { name: 'Analytics', description: 'Data tren dan analitik' },
      { name: 'IoT', description: 'Endpoint HTTP fallback untuk perangkat IoT' },
      { name: 'EcoBot', description: 'Chatbot AI EcoRoute — tanya seputar sampah, TPS, IoT, dan lingkungan. Dijawab dalam Bahasa Indonesia.' },
      { name: 'System', description: 'Health check dan status sistem' },
    ],
  },
  apis: ['./src/docs/*.yaml', './src/routes/*.js', './src/controllers/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
