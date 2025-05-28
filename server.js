require('dotenv').config(); // Load environment variables from .env file

const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');
const nodemailer = require('nodemailer');
const cors = require('cors');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;

// Unified database path logic: always use this
const dbPath = process.env.DATABASE_URL || 'users.db';
console.log("Database URL:", dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to database:', err);
  } else {
    console.log('Connected to the database');
  }
});

// Initialize the app
const app = express();
app.use(bodyParser.json());
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files (if any)
app.use(express.static('public'));

// Example route for registering a new user
/*
app.post('/register', (req, res) => {
  const { name, email, phone, password } = req.body;
  if (!name || !email || !phone || !password) {
    return res.status(400).json({ error: 'All fields are required.' });
  }
  const hashedPassword = bcrypt.hashSync(password, 10);

  const sql = `INSERT INTO users (name, email, phone, password) VALUES (?, ?, ?, ?)`;
  db.run(sql, [name, email, phone, hashedPassword], function(err) {
    if (err) {
      if (err.code === 'SQLITE_CONSTRAINT') {
        return res.status(400).json({ error: 'Email already registered.' });
      }
      return res.status(500).json({ error: 'Database error.' });
    }
    res.status(201).json({ message: 'User registered successfully!', userId: this.lastID });
  });
});
*/

app.post('/register', (req, res) => {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !phone || !password) {
        return res.status(400).json({ error: 'All fields are required.' });
    }
    db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
        if (err) return res.status(500).json({ error: 'Database error.' });
        if (user) return res.status(400).json({ error: 'Email already registered.' });

        const hashedPassword = require('bcrypt').hashSync(password, 10);
        db.run('INSERT INTO users (name, email, phone, password, created_at) VALUES (?, ?, ?, ?, datetime("now"))',
            [name, email, phone, hashedPassword],
            function(err) {
                if (err) return res.status(500).json({ error: 'Database error.' });
                res.json({ message: 'Registration successful!' });
            }
        );
    });
});

// Email transporter setup (Gmail example, see .env section below)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

transporter.verify((error, success) => {
    if (error) {
        console.error('Email transport error:', error);
    } else {
        console.log('Email server is ready to take messages');
    }
});

// Example route for posting a message
/*app.post('/messages', (req, res) => {
  const { email, message } = req.body;
  if (!email || !message) {
    return res.status(400).json({ error: 'Email and message are required.' });
  }
  db.get(`SELECT id FROM users WHERE email = ?`, [email], (err, user) => {
    if (err) return res.status(500).json({ error: 'Database error.' });
    if (!user) return res.status(404).json({ error: 'User not found.' });

    db.run(`INSERT INTO messages (user_id, message) VALUES (?, ?)`, [user.id, message], function(err) {
      if (err) return res.status(500).json({ error: 'Database error.' });
      res.status(201).json({ message: 'Message posted!', messageId: this.lastID });
    });
  });
});
*/

app.post('/messages', (req, res) => {
    const { email, message } = req.body;
    if (!email || !message) {
        return res.status(400).json({ error: 'Email and message are required.' });
    }
    db.get('SELECT id, name FROM users WHERE email = ?', [email], (err, user) => {
        if (err) return res.status(500).json({ error: 'Database error.' });
        if (!user) return res.status(404).json({ error: 'User not found.' });

        db.run('INSERT INTO messages (user_id, message) VALUES (?, ?)', [user.id, message], function(err) {
            if (err) return res.status(500).json({ error: 'Database error.' });

            // Send confirmation email
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: email,
                subject: 'Message Received - XYZ Hotel',
                text: `Hello${user.name ? ' ' + user.name : ''},\n\nThank you for your message:\n"${message}"\n\nOur team will get back to you shortly.\n\nBest regards,\nXYZ Hotel`
            };
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error('Confirmation email error:', error);
                    return res.json({ message: 'Message posted! (Email confirmation failed)' });
                }
                res.json({ message: 'Message posted! Confirmation email sent.' });
            });
        });
    });
});


app.post('/admin-login', (req, res) => {
    const { email, password } = req.body;
    db.get(`SELECT * FROM users WHERE email = ?`, [email], (err, user) => {
        if(err) return res.status(500).json({ error: 'Database error.' });
        if(!user || user.name.toLowerCase() !== 'admin') return res.status(401).json({ error: 'Not an admin or invalid credentials.' });
        if(!bcrypt.compareSync(password, user.password)) return res.status(401).json({ error: 'Invalid credentials.' });
        res.json({ success: true });
    });
});


app.post('/reset-password', (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required.' });

    db.get(`SELECT * FROM users WHERE email = ?`, [email], (err, user) => {
        if (err) return res.status(500).json({ error: 'Database error.' });
        if (!user) return res.status(404).json({ error: 'No user with that email.' });

        const token = crypto.randomBytes(32).toString('hex');
        db.run(`UPDATE users SET reset_token = ? WHERE email = ?`, [token, email], function(err) {
            if (err) return res.status(500).json({ error: 'Failed to set reset token.' });

            // Construct reset link (adjust host as needed)
            const resetLink = `http://localhost:3000/new-password.html?token=${token}`;

            // Send password reset email
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: email,
                subject: 'Password Reset Request',
                html: `<p>Hello ${user.name || ''},</p>
                       <p>You requested a password reset. Click the link below to set a new password:</p>
                       <a href="${resetLink}">${resetLink}</a>
                       <p>If you did not request this, please ignore this email.</p>`
            };
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error('Email send error:', error);
                    return res.status(500).json({ error: 'Failed to send reset email.' });
                }
                res.json({ message: 'Password reset email sent!' });
            });
        });
    });
});

app.post('/new-password', (req, res) => {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) return res.status(400).json({ error: 'Token and new password are required.' });

    // Find user by token
    db.get(`SELECT * FROM users WHERE reset_token = ?`, [token], (err, user) => {
        if (err) return res.status(500).json({ error: 'Database error.' });
        if (!user) return res.status(400).json({ error: 'Invalid or expired token.' });

        // Hash new password and update
        const hashedPassword = bcrypt.hashSync(newPassword, 10);
        db.run(`UPDATE users SET password = ?, reset_token = NULL WHERE id = ?`, [hashedPassword, user.id], function(err) {
            if (err) return res.status(500).json({ error: 'Failed to update password.' });
            res.json({ message: 'Password has been reset successfully!' });
        });
    });
});


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

const seedDatabase = require('./seed'); // Adjust the path if needed
seedDatabase(); // Ensure this runs before the server starts

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});