const bcrypt = require('bcryptjs');
const User = require('../models/user');
const SystemSetting = require('../models/systemSetting');
const { ApiError } = require('../utils/apiError');

const createSetupLockedError = () =>
  new ApiError(409, 'Setup wurde bereits abgeschlossen.', {
    code: 'SETUP_COMPLETED'
  });

const ensureSetupAvailable = () => {
  if (User.count() > 0) {
    throw createSetupLockedError();
  }
};

exports.status = (req, res, next) => {
  try {
    ensureSetupAvailable();

    return res.json({
      success: true,
      data: {
        requiresSetup: true
      }
    });
  } catch (error) {
    return next(ApiError.from(error));
  }
};

exports.setup = (req, res, next) => {
  try {
    ensureSetupAvailable();

    const { email, password, companyName } = req.body;

    const password_hash = bcrypt.hashSync(password, 10);
    const username = email.trim().toLowerCase();

    const user = User.create({
      username,
      email: email.trim(),
      password_hash,
      role: 'ADMIN',
      is_active: 1
    });

    SystemSetting.set('companyName', companyName.trim());

    return res.status(201).json({
      success: true,
      message: 'Setup erfolgreich abgeschlossen.',
      data: {
        user: {
          user_id: user.user_id,
          username: user.username,
          email: user.email,
          role: user.role
        }
      }
    });
  } catch (error) {
    return next(ApiError.from(error));
  }
};
