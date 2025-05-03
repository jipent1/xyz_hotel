const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');

// Initialize the app
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

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
    const { user_id, message } = req.body;
    const query = `INSERT INTO messages (user_id, message) VALUES (?, ?)`;
    db.run(query, [user_id, message], function (err) {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        res.json({ id: this.lastID, message: 'Message sent successfully!' });
    });
});

// 3. Admin Login
const ADMIN_PASSWORD_HASH = bcrypt.hashSync('admin123', 10); // Hardcoded admin password
app.post('/api/admin-login', (req, res) => {
    const { password } = req.body;
    if (bcrypt.compareSync(password, ADMIN_PASSWORD_HASH)) {
        res.json({ success: true, message: 'Admin authenticated successfully!' });
    } else {
        res.status(401).json({ success: false, message: 'Invalid password' });
    }
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