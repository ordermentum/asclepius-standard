const asclepius = require('asclepius');
const nullLogger = require('null-logger');

const sequelizeHealthcheck = (sequelize, logger = nullLogger) => asclepius.healthcheck(
  'psql',
  () =>
    sequelize
      .query('select current_timestamp')
      .then(() => {})
      .catch(err => {
        logger.error('PSQL Healthcheck Failed. Reason:', err);
        return Promise.reject(err.name);
      }),
  500
);

const redisHealthcheck = (redis, logger = nullLogger) => asclepius.healthcheck(
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
  500
);

const elasticsearchHealthcheck = (elasticsearch, logger = nullLogger) => asclepius.healthcheck(
  'elasticsearch',
  () =>
    elasticsearch
      .ping()
      .then(() => {})
      .catch(err => {
        logger.error('Elasticsearch Healthcheck Failed. Reason:', err);
        return Promise.reject('Ping Failed');
      }),
  500
);

const processHealthcheck = asclepius.healthcheck(
  'process',
  () => Promise.resolve(),
  500
);

module.exports = {
  setup: ({ sequelize = null, redis = null, elasticsearch = null, logger = nullLogger } = {}, others = []) => {
    const healthchecks = [processHealthcheck, ...others.map(o => asclepius.healthcheck(o.name, o.fn, o.timeout))];

    if (sequelize) healthchecks.push(sequelizeHealthcheck(sequelize, logger));
    if (elasticsearch) healthchecks.push(elasticsearchHealthcheck(elasticsearch, logger));
    if (redis) healthchecks.push(redisHealthcheck(redis, logger));
    return asclepius.makeRoute(healthchecks);
  }
};
