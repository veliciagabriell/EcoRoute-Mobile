import dotenv from 'dotenv';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

function findEnvFile() {
  const candidates = [];
  // CommonJS context (__dirname = direktori app.config.js = ecoroute-mobile/)
  try { candidates.push(resolve(__dirname, '../.env')); } catch (_) {}
  // Fallback: cwd saat expo dijalankan
  try { candidates.push(resolve(process.cwd(), '.env')); } catch (_) {}
  try { candidates.push(resolve(process.cwd(), '../.env')); } catch (_) {}
  return candidates.find(p => { try { return existsSync(p); } catch (_) { return false; } }) ?? null;
}

const envPath = findEnvFile();
const env = envPath ? dotenv.parse(readFileSync(envPath, 'utf8')) : {};

export default ({ config }) => {
  return {
    ...config,
    extra: {
      API_URL: env.EXPO_PUBLIC_API_URL,
      MQTT_URL: env.EXPO_PUBLIC_MQTT_URL,
      ECOBOT_URL: env.EXPO_PUBLIC_ECOBOT_URL,
      DEMO_LOGIN:
        env.EXPO_PUBLIC_DEMO_LOGIN === undefined
          ? true
          : env.EXPO_PUBLIC_DEMO_LOGIN !== 'false'
    }
  };
};
