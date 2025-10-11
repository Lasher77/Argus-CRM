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

exports.login = (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Benutzername/E-Mail und Passwort erforderlich' });
    }

    const user = User.findByUsernameOrEmail(username);

    if (!user || !user.is_active) {
      return res.status(401).json({ success: false, message: 'Ungültige Anmeldedaten' });
    }

    const passwordValid = bcrypt.compareSync(password, user.password_hash);

    if (!passwordValid) {
      return res.status(401).json({ success: false, message: 'Ungültige Anmeldedaten' });
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
    console.error('Fehler beim Login:', error);
    return res.status(500).json({ success: false, message: 'Interner Serverfehler' });
  }
};

exports.refresh = (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ success: false, message: 'Refresh Token erforderlich' });
    }

    const storedToken = RefreshToken.findByToken(refreshToken);

    if (!storedToken) {
      return res.status(401).json({ success: false, message: 'Ungültiges Refresh Token' });
    }

    try {
      jwt.verify(refreshToken, refreshTokenSecret);
    } catch (error) {
      console.error('Fehler bei der Refresh-Token-Prüfung:', error);
      RefreshToken.deleteByToken(refreshToken);
      return res.status(401).json({ success: false, message: 'Ungültiges oder abgelaufenes Refresh Token' });
    }

    if (storedToken.revoked_at) {
      RefreshToken.deleteByToken(refreshToken);
      return res.status(401).json({ success: false, message: 'Refresh Token wurde widerrufen' });
    }

    if (new Date(storedToken.expires_at) <= new Date()) {
      RefreshToken.deleteByToken(refreshToken);
      return res.status(401).json({ success: false, message: 'Refresh Token ist abgelaufen' });
    }

    const payload = jwt.decode(refreshToken);

    if (!payload || !payload.sub) {
      RefreshToken.deleteByToken(refreshToken);
      return res.status(401).json({ success: false, message: 'Ungültiges Refresh Token' });
    }

    const user = User.findById(payload.sub);

    if (!user || !user.is_active) {
      RefreshToken.deleteByToken(refreshToken);
      return res.status(401).json({ success: false, message: 'Benutzerkonto nicht aktiv' });
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
    console.error('Fehler beim Aktualisieren des Tokens:', error);
    return res.status(500).json({ success: false, message: 'Interner Serverfehler' });
  }
};

exports.logout = (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ success: false, message: 'Refresh Token erforderlich' });
    }

    RefreshToken.deleteByToken(refreshToken);

    return res.json({ success: true, message: 'Abmeldung erfolgreich' });
  } catch (error) {
    console.error('Fehler beim Logout:', error);
    return res.status(500).json({ success: false, message: 'Interner Serverfehler' });
  }
};
