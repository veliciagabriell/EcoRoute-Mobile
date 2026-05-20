import 'dotenv/config';

export default ({ config }) => {
  return {
    ...config,
    extra: {
      API_URL: process.env.API_URL,
      MQTT_URL: process.env.EXPO_PUBLIC_MQTT_URL,
      ECOBOT_URL: process.env.EXPO_PUBLIC_ECOBOT_URL,
      DEMO_LOGIN:
        process.env.EXPO_PUBLIC_DEMO_LOGIN === undefined
          ? true
          : process.env.EXPO_PUBLIC_DEMO_LOGIN !== 'false'
    }
  };
};
