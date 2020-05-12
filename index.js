const asclepius = require('asclepius');
const nullLogger = require('null-logger');

const defaultTimeout = 500;

const sequelizeHealthcheck = (sequelize, logger = nullLogger, timeout = defaultTimeout) => asclepius.healthcheck(
  'psql',
  () =>
    sequelize
      .query('select current_timestamp')
      .then(() => {})
      .catch(err => {
        logger.error('PSQL Healthcheck Failed. Reason:', err);
        return Promise.reject(err.name);
      }),
  timeout
);

const redisHealthcheck = (redis, logger = nullLogger, timeout = defaultTimeout) => asclepius.healthcheck(
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
  timeout
);

const elasticsearchHealthcheck = (elasticsearch, logger = nullLogger, timeout = defaultTimeout) => asclepius.healthcheck(
  'elasticsearch',
  () =>
    elasticsearch
      .ping()
      .then(() => {})
      .catch(err => {
        logger.error('Elasticsearch Healthcheck Failed. Reason:', err);
        return Promise.reject('Ping Failed');
      }),
  timeout
);

const processHealthcheck = asclepius.healthcheck(
  'process',
  () => Promise.resolve(),
  defaultTimeout
);

const _buildHealthCheckArray = ({ sequelize = null, redis = null, elasticsearch = null, logger = nullLogger, timeout = defaultTimeout } = {}) => {
    const healthchecks = [processHealthcheck];

    if (sequelize) healthchecks.push(sequelizeHealthcheck(sequelize, logger, timeout));
    if (elasticsearch) healthchecks.push(elasticsearchHealthcheck(elasticsearch, logger, timeout));
    if (redis) healthchecks.push(redisHealthcheck(redis, logger, timeout));

    return healthchecks;
}

module.exports = {
  setup: ({ sequelize = null, redis = null, elasticsearch = null, logger = nullLogger, timeout = defaultTimeout } = {}) => {
    const healthchecks = _buildHealthCheckArray({ sequelize, redis, elasticsearch, logger, timeout });
    return asclepius.makeRoute(healthchecks);
  },
  runner: ({ sequelize = null, redis = null, elasticsearch = null, logger = nullLogger, timeout = defaultTimeout } = {}) => {
    const healthchecks = _buildHealthCheckArray({ sequelize, redis, elasticsearch, logger, timeout });
    return asclepius.makeRunner(healthchecks);
  }
};
