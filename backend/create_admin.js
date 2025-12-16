const db = require('./db/database');
const bcrypt = require('bcryptjs');

const createAdmin = async () => {
  const passwordHash = await bcrypt.hash('password123', 10);

  try {
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get('admin');

    if (user) {
        console.log('Updating existing admin user...');
        db.prepare('UPDATE users SET password_hash = ? WHERE username = ?').run(passwordHash, 'admin');
        console.log('Admin password updated to password123');
    } else {
        console.log('Creating new admin user...');
        const stmt = db.prepare(`
          INSERT INTO users (username, email, password_hash, first_name, last_name, role, is_active)
          VALUES (@username, @email, @password_hash, 'Admin', 'User', 'ADMIN', 1)
        `);

        stmt.run({
          username: 'admin',
          email: 'admin@example.com',
          password_hash: passwordHash
        });
        console.log('Admin user created');
    }
  } catch (err) {
    console.error('Error:', err);
  }
};

createAdmin();
