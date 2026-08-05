var Redis = require('ioredis');

var redisHost = process.env.REDIS_HOST || 'localhost';
var redisPort = parseInt(process.env.REDIS_PORT, 10) || 6379;
var isRedisAvailable = false;
var pubClient = null;
var subClient = null;

if (process.env.REDIS_HOST || process.env.REDIS_URL) {
  try {
    var connectionOptions = process.env.REDIS_URL || {
      host: redisHost,
      port: redisPort,
      connectTimeout: 2000,
      maxRetriesPerRequest: 1
    };
    pubClient = new Redis(connectionOptions);
    subClient = new Redis(connectionOptions);

    pubClient.on('connect', function() {
      isRedisAvailable = true;
      console.log('[Redis Engine] Redis Pub/Sub cluster connection established.');
    });

    pubClient.on('error', function(err) {
      isRedisAvailable = false;
      console.warn('[Redis Engine] Redis unavailable, using local event bus:', err.message);
    });
  } catch (err) {
    console.warn('[Redis Engine] Could not initialize Redis clients:', err.message);
  }
}

function publishEvent(channel, message) {
  if (isRedisAvailable && pubClient) {
    try {
      pubClient.publish(channel, JSON.stringify(message));
    } catch (err) {
      console.warn('[Redis Engine] Pub error:', err.message);
    }
  }
}

function subscribeEvent(channel, callback) {
  if (isRedisAvailable && subClient) {
    try {
      subClient.subscribe(channel);
      subClient.on('message', function(chan, msg) {
        if (chan === channel) {
          try {
            callback(JSON.parse(msg));
          } catch (e) {
            callback(msg);
          }
        }
      });
    } catch (err) {
      console.warn('[Redis Engine] Sub error:', err.message);
    }
  }
}

module.exports = {
  isRedisAvailable,
  publishEvent,
  subscribeEvent
};
