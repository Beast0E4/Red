const redis = require('redis');

let client;
const connectRedis = () => {
  client = redis.createClient({ url: process.env.REDIS_URL });
  client.on('error', (err) => console.error('Redis error:', err));
  client.connect();
  console.log('Redis connected');
};

module.exports = { connectRedis, client };