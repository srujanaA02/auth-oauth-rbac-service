const Redis = require('ioredis');
const config = require('./env');

const redis = new Redis(config.redis.url);

redis.on('connect', () => {
  console.log('Connected to Redis');
});

redis.on('error', (err) => {
  console.error('Redis connection error:', err);
});

module.exports = redis;
