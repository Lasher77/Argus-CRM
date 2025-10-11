const jwt = require('jsonwebtoken');
const { accessTokenSecret } = require('../config/authConfig');

const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authentifizierung erforderlich' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, accessTokenSecret);
    req.user = {
      id: payload.sub,
      username: payload.username,
      role: payload.role
    };
    next();
  } catch (error) {
    console.error('Fehler bei der Tokenprüfung:', error);
    return res.status(401).json({ success: false, message: 'Ungültiges oder abgelaufenes Token' });
  }
};

const authorizeRoles = (...roles) => {
  const allowedRoles = roles.flat();

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentifizierung erforderlich' });
    }

    if (allowedRoles.length === 0 || allowedRoles.includes(req.user.role)) {
      return next();
    }

    return res.status(403).json({ success: false, message: 'Nicht ausreichende Berechtigungen' });
  };
};

module.exports = {
  authenticateJWT,
  authorizeRoles
};
