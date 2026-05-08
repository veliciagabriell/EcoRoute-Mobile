const mqtt = require('mqtt');
const dotenv = require('dotenv');
dotenv.config();

const client = mqtt.connect(process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883');

client.on('connect', () => {
  console.log('MQTT connected');
  client.subscribe('ecoroute/tps/+/data', { qos: 1 }, (err) => {
    if (err) console.error('MQTT subscribe error', err);
  });
  client.subscribe('ecoroute/tps/+/critical', { qos: 1 }, (err) => {
    if (err) console.error('MQTT subscribe error', err);
  });
});

client.on('error', (err) => console.error('MQTT error', err));

module.exports = client;
