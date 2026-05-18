import 'dotenv/config';

export default ({ config }) => {
  return {
    ...config,
    extra: {
      API_URL: process.env.API_URL,
      DEMO_LOGIN:
        process.env.EXPO_PUBLIC_DEMO_LOGIN === undefined
          ? true
          : process.env.EXPO_PUBLIC_DEMO_LOGIN !== 'false'
    }
  };
};
