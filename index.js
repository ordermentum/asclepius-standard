const asclepius = require('asclepius');

const sequelizeHealthcheck = (sequelize) => asclepius.healthcheck(
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

const redisHealthcheck = (redis) => asclepius.healthcheck(
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

const elasticsearchHealthcheck = (elasticsearch) => asclepius.healthcheck(
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

const processHealthcheck = => asclepius.healthcheck(
  'process',
  () => Promise.resolve(),
  500
);

module.exports = {
  setup: ({ sequelize = null, redis = null, elasticsearch = null } = {}) => {
    const healthchecks = [processHealthcheck];

    if (sequelize) healthchecks.push(sequelizeHealthcheck(sequelize));
    if (elasticsearch) healthchecks.push(elasticsearchHealthcheck(elasticsearch));
    if (redis) healthchecks.push(redisHealthcheck(redis));
    return asclepius.makeRoute(healthchecks);
  }
};
