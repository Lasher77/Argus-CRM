const env = require('./env');

const accessTokenSecret = env.JWT_ACCESS_SECRET || 'change-me-access-secret';
const refreshTokenSecret = env.JWT_REFRESH_SECRET || 'change-me-refresh-secret';
const accessTokenExpiresIn = parseInt(env.JWT_ACCESS_EXPIRES_IN ?? '900', 10); // default 15 Minuten
const refreshTokenExpiresIn = parseInt(env.JWT_REFRESH_EXPIRES_IN ?? '604800', 10); // default 7 Tage

module.exports = {
  accessTokenSecret,
  refreshTokenSecret,
  accessTokenExpiresIn,
  refreshTokenExpiresIn
};
