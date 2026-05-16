import 'dotenv/config';

export default ({ config }) => {
  return {
    ...config,
    extra: {
      API_URL: process.env.API_URL || 'http://10.0.2.2:3000/api'
    }
  };
};
