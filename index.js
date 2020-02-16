const asclepius = require('asclepius');
const nullLogger = require('null-logger');

const sequelizeHealthcheck = (sequelize, logger = nullLogger, interval = 500) => asclepius.healthcheck(
  'psql',
  () =>
    sequelize
      .query('select current_timestamp')
      .then(() => {})
      .catch(err => {
        logger.error('PSQL Healthcheck Failed. Reason:', err);
        return Promise.reject(err.name);
      }),
  interval
);

const redisHealthcheck = (redis, logger = nullLogger, interval = 500) => asclepius.healthcheck(
  'redis',
  () =>
    new Promise((resolve, reject) => {
      redis.ping(err => {
        if (err) {
          logger.error('Redis Healthcheck Failed. Reason:', err);
          return reject(err);
        }
        return resolve();
      });
    }),
  interval
);

const elasticsearchHealthcheck = (elasticsearch, logger = nullLogger, interval = 500) => asclepius.healthcheck(
  'elasticsearch',
  () =>
    elasticsearch
      .ping()
      .then(() => {})
      .catch(err => {
        logger.error('Elasticsearch Healthcheck Failed. Reason:', err);
        return Promise.reject('Ping Failed');
      }),
  interval
);

const processHealthcheck = (interval = 500) => asclepius.healthcheck(
  'process',
  () => Promise.resolve(),
  interval
);

module.exports = {
  setup: ({ sequelize = null, redis = null, elasticsearch = null, logger = nullLogger, interval = 500 } = {}) => {
    const healthchecks = [processHealthcheck(interval)];

    if (sequelize) healthchecks.push(sequelizeHealthcheck(sequelize, logge, intervalr));
    if (elasticsearch) healthchecks.push(elasticsearchHealthcheck(elasticsearch, logger, interval));
    if (redis) healthchecks.push(redisHealthcheck(redis, logger, interval));
    return asclepius.makeRoute(healthchecks);
  }
};
