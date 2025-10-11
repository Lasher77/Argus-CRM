const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const RefreshToken = require('../models/refreshToken');
const {
  accessTokenSecret,
  refreshTokenSecret,
  accessTokenExpiresIn,
  refreshTokenExpiresIn
} = require('../config/authConfig');
const { ApiError } = require('../utils/apiError');

const sanitizeUser = (user) => {
  if (!user) {
    return null;
  }

  const { password_hash, ...rest } = user;
  return rest;
};

const createAccessToken = (user) =>
  jwt.sign(
    {
      sub: user.user_id,
      username: user.username,
      role: user.role
    },
    accessTokenSecret,
    { expiresIn: accessTokenExpiresIn }
  );

const createRefreshToken = (user) =>
  jwt.sign(
    {
      sub: user.user_id,
      type: 'refresh'
    },
    refreshTokenSecret,
    { expiresIn: refreshTokenExpiresIn }
  );

const getRefreshExpiryDate = () =>
  new Date(Date.now() + refreshTokenExpiresIn * 1000).toISOString();

exports.login = (req, res, next) => {
  try {
    const { username, password } = req.body;

    const user = User.findByUsernameOrEmail(username);

    if (!user || !user.is_active) {
      return next(new ApiError(401, 'Ungültige Anmeldedaten', { code: 'INVALID_CREDENTIALS' }));
    }

    const passwordValid = bcrypt.compareSync(password, user.password_hash);

    if (!passwordValid) {
      return next(new ApiError(401, 'Ungültige Anmeldedaten', { code: 'INVALID_CREDENTIALS' }));
    }

    const accessToken = createAccessToken(user);
    const refreshToken = createRefreshToken(user);

    RefreshToken.deleteByUserId(user.user_id);
    RefreshToken.create(user.user_id, refreshToken, getRefreshExpiryDate());
    User.updateLastLogin(user.user_id);

    return res.json({
      success: true,
      data: {
        accessToken,
        refreshToken,
        user: sanitizeUser(user)
      }
    });
  } catch (error) {
    return next(ApiError.from(error));
  }
};

exports.refresh = (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    const storedToken = RefreshToken.findByToken(refreshToken);

    if (!storedToken) {
      return next(new ApiError(401, 'Ungültiges Refresh Token', { code: 'INVALID_REFRESH_TOKEN' }));
    }

    try {
      jwt.verify(refreshToken, refreshTokenSecret);
    } catch (error) {
      RefreshToken.deleteByToken(refreshToken);
      return next(
        new ApiError(401, 'Ungültiges oder abgelaufenes Refresh Token', {
          code: 'EXPIRED_REFRESH_TOKEN'
        })
      );
    }

    if (storedToken.revoked_at) {
      RefreshToken.deleteByToken(refreshToken);
      return next(new ApiError(401, 'Refresh Token wurde widerrufen', { code: 'REVOKED_REFRESH_TOKEN' }));
    }

    if (new Date(storedToken.expires_at) <= new Date()) {
      RefreshToken.deleteByToken(refreshToken);
      return next(new ApiError(401, 'Refresh Token ist abgelaufen', { code: 'EXPIRED_REFRESH_TOKEN' }));
    }

    const payload = jwt.decode(refreshToken);

    if (!payload || !payload.sub) {
      RefreshToken.deleteByToken(refreshToken);
      return next(new ApiError(401, 'Ungültiges Refresh Token', { code: 'INVALID_REFRESH_TOKEN' }));
    }

    const user = User.findById(payload.sub);

    if (!user || !user.is_active) {
      RefreshToken.deleteByToken(refreshToken);
      return next(new ApiError(401, 'Benutzerkonto nicht aktiv', { code: 'INACTIVE_USER' }));
    }

    const accessToken = createAccessToken(user);
    const newRefreshToken = createRefreshToken(user);

    RefreshToken.deleteByToken(refreshToken);
    RefreshToken.create(user.user_id, newRefreshToken, getRefreshExpiryDate());

    return res.json({
      success: true,
      data: {
        accessToken,
        refreshToken: newRefreshToken
      }
    });
  } catch (error) {
    return next(ApiError.from(error));
  }
};

exports.logout = (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    RefreshToken.deleteByToken(refreshToken);

    return res.json({ success: true, message: 'Abmeldung erfolgreich' });
  } catch (error) {
    return next(ApiError.from(error));
  }
};
