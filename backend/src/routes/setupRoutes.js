const express = require('express');
const router = express.Router();
const User = require('../models/user');
const bcrypt = require('bcryptjs');

// Check if setup is required (no users in DB)
router.get('/status', (req, res) => {
  const count = User.count();
  res.json({
    initialized: count > 0
  });
});

// Create initial admin account
router.post('/register', async (req, res) => {
  try {
    const count = User.count();
    if (count > 0) {
      return res.status(403).json({ error: 'System already initialized' });
    }

    const { username, email, password, firstName, lastName } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = User.create({
      username,
      email,
      password_hash: passwordHash,
      first_name: firstName,
      last_name: lastName,
      role: 'ADMIN',
      is_active: 1
    });

    res.status(201).json({
      message: 'Initial admin account created successfully',
      user: {
        id: newUser.user_id,
        username: newUser.username
      }
    });
  } catch (error) {
    console.error('Setup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
