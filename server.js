const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');
const nodemailer = require('nodemailer');  
const crypto = require('crypto');


// Initialize the app
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// const crypto = require('crypto');

// Generate and send reset token
app.post('/api/reset-password', (req, res) => {
    const { email } = req.body;

    const resetToken = crypto.randomBytes(32).toString('hex'); // Generate a random token
    const updateTokenQuery = `UPDATE users SET reset_token = ? WHERE email = ?`;

    db.run(updateTokenQuery, [resetToken, email], function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Email not found' });
        }

        // Correct the reset link to point to new-password.html
        const resetLink = `http://localhost:3000/new-password.html?token=${resetToken}`; // Updated to new-password.html
        const mailOptions = {
            from: 'jipent123@gmail.com',
            to: email,
            subject: 'Password Reset - XYZ Hotel',
            text: `Hello,\n\nClick the link below to reset your password:\n${resetLink}\n\nBest regards,\nXYZ Hotel`
        };

        transporter.sendMail(mailOptions, (err, info) => {
            if (err) {
                console.error('Error sending email:', err);
                return res.status(500).json({ error: 'Failed to send reset email' });
            }
            console.log('Reset email sent:', info.response);
            res.json({ message: 'Password reset email sent successfully!' });
        });
    });
});

// Reset password with token
app.post('/api/update-password', (req, res) => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
        return res.status(400).json({ error: 'Token and new password are required.' });
    }

    // Validate token and fetch user
    const getTokenQuery = `SELECT id FROM users WHERE reset_token = ?`;
    db.get(getTokenQuery, [token], (err, user) => {
        if (err) {
            console.error('Error fetching user by token:', err.message);
            return res.status(500).json({ error: 'Internal server error.' });
        }
        if (!user) {
            console.log('Invalid or expired token.');
            return res.status(400).json({ error: 'Invalid or expired reset token.' });
        }

        console.log('User found for token:', user);

        // Hash the new password
        const hashedPassword = bcrypt.hashSync(newPassword, 10);
        console.log('New hashed password:', hashedPassword);

        // Update password and clear reset token
        const updatePasswordQuery = `UPDATE users SET password = ?, reset_token = NULL WHERE id = ?`;
        db.run(updatePasswordQuery, [hashedPassword, user.id], function (err) {
            if (err) {
                console.error('Error updating password:', err.message);
                return res.status(500).json({ error: 'Failed to update password.' });
            }

            if (this.changes === 0) {
                console.log('No rows updated. Likely an invalid user ID.');
                return res.status(400).json({ error: 'Password update failed.' });
            }

            console.log('Password updated successfully for user ID:', user.id);
            res.json({ message: 'Password updated successfully!' });
        });
    });
});

// Configure Nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail', // Use your email provider (Gmail, Outlook, etc.)
  auth: {
      user: 'jipent123@gmail.com', // Replace with your email
      pass: 'dphuxmtivvxrpqmy'  // Replace with your email password or app password
  }
});

// Route to submit a message and send confirmation email
app.post('/api/message', (req, res) => {
  const { email, message } = req.body;

  // Get user ID by email
  const getUserQuery = `SELECT id FROM users WHERE email = ?`;
  db.get(getUserQuery, [email], (err, user) => {
      if (err) {
          return res.status(500).json({ error: err.message });
      }
      if (!user) {
          return res.status(404).json({ error: 'User not found. Please register first.' });
      }

      // Insert message
      const insertMessageQuery = `INSERT INTO messages (user_id, message) VALUES (?, ?)`;
      db.run(insertMessageQuery, [user.id, message], function (err) {
          if (err) {
              return res.status(400).json({ error: err.message });
          }

          // Send confirmation email
          const mailOptions = {
              from: 'jipent123@gmail.com',
              to: email,
              subject: 'Message Received - XYZ Hotel',
              text: `Hello,\n\nThank you for your message:\n"${message}"\n\nOur team will get back to you shortly.\n\nBest regards,\nXYZ Hotel`
          };

          transporter.sendMail(mailOptions, (err, info) => {
              if (err) {
                  console.error('Error sending email:', err);
                  return res.status(500).json({ error: 'Failed to send confirmation email' });
              }
              console.log('Email sent:', info.response);

              res.json({ id: this.lastID, message: 'Message sent successfully! Confirmation email sent.' });
          });
      });
  });
});

// Initialize the database
const db = new sqlite3.Database('users.db');

// Routes

// 1. User Registration
app.post('/api/register', (req, res) => {
    const { name, email, phone } = req.body;
    const query = `INSERT INTO users (name, email, phone) VALUES (?, ?, ?)`;
    db.run(query, [name, email, phone], function (err) {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        res.json({ id: this.lastID, message: 'User registered successfully!' });
    });
});

// 2. Member Messages
app.post('/api/message', (req, res) => {
  const { email, message } = req.body;

  // Find user by email
  const queryUser = `SELECT id FROM users WHERE email = ?`;
  db.get(queryUser, [email], (err, row) => {
      if (err) {
          return res.status(500).json({ error: 'Database error' });
      }

      if (!row) {
          return res.status(404).json({ error: 'User not found' });
      }

      const userId = row.id;

      // Insert the message
      const queryMessage = `INSERT INTO messages (user_id, message) VALUES (?, ?)`;
      db.run(queryMessage, [userId, message], function (err) {
          if (err) {
              return res.status(400).json({ error: err.message });
          }
          res.json({ id: this.lastID, message: 'Message sent successfully!' });
      });
  });
});

// 3. Admin Login
const ADMIN_PASSWORD_HASH = bcrypt.hashSync('admin123', 10); // Hardcoded admin password
/*
app.post('/api/admin-login', (req, res) => {
    const { password } = req.body;
    if (bcrypt.compareSync(password, ADMIN_PASSWORD_HASH)) {
        res.json({ success: true, message: 'Admin authenticated successfully!' });
    } else {
        res.status(401).json({ success: false, message: 'Invalid password' });
    }
});
*/
app.post('/api/admin-login', (req, res) => {
    const { password } = req.body;

    console.log('Admin login attempt with password:', password);

    const getAdminQuery = `SELECT password FROM users WHERE email = 'jipent123@gmail.com'`;
    db.get(getAdminQuery, (err, user) => {
        if (err) {
            console.error('Error fetching admin user:', err.message);
            return res.status(500).json({ error: 'Internal server error.' });
        }

        if (!user) {
            console.log('Admin user not found in the database.');
            return res.status(404).json({ error: 'Admin user not found.' });
        }

        console.log('Admin user retrieved:', user);

        // Compare entered password with hashed password
        const isMatch = bcrypt.compareSync(password, user.password);
        if (!isMatch) {
            console.log('Invalid password entered.');
            return res.status(401).json({ error: 'Invalid password.' });
        }

        console.log('Password valid. Redirecting to admin.html.');
        res.json({ message: 'Login successful!' });
    });
});

// 4. Fetch Database Content for Admin
app.get('/api/data', (req, res) => {
    const query = `
        SELECT 
            users.id AS user_id,
            users.name,
            users.email,
            users.phone,
            messages.message,
            messages.created_at AS timestamp
        FROM users
        LEFT JOIN messages
        ON users.id = messages.user_id
        ORDER BY messages.created_at DESC;
    `;
    db.all(query, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});