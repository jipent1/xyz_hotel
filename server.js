const express = require("express");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");
const Database = require("better-sqlite3");
const cors = require("cors");
const path = require('path'); // For working with file paths
const hotelName = "xyz_hotel";


const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Route for the home page (index.html)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Route for the member page
app.get('/member', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'member.html'));
});

// Route for the admin page
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Read the database file path from the environment variable
const dbFile = process.env.DATABASE_FILE || 'users.db';

// Initialize SQLite Database
const db = new Database("users.db", { verbose: console.log });
db.exec(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT UNIQUE,
    phone TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`);
db.exec(`CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
)`);

// Nodemailer Transporter (Update with your email credentials)
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "jipent123@gmail.com", 
      pass: "dphuxmtivvxrpqmy"  
    }
});

// 📌 Route 1: Handle Sign-up (Prevents Duplicate Sign-ups)
app.post("/signup", (req, res) => {
    const { name, email, phone } = req.body;
    if (!name || !email || !phone) {
        return res.status(400).json({ error: "All fields are required" });
    }

    // Check if user already exists
    const existingUser = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
    if (existingUser) {
        return res.status(400).json({ error: "User already exists! Sign up not allowed twice." });
    }

    // Insert new user
    const stmt = db.prepare("INSERT INTO users (name, email, phone) VALUES (?, ?, ?)");
    stmt.run(name, email, phone);

    res.status(200).json({ message: "Signup successful!" });
});

// 📌 Route 2: Handle Message Submission (Prevents Overwriting)
app.post("/message", (req, res) => {
    const { name, email, message } = req.body;
    if (!name || !email || !message) {
        return res.status(400).json({ error: "All fields are required" });
    }

    // Check if user exists
    const user = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
    if (!user) {
        return res.status(404).json({ error: "User not found! Please sign up first." });
    }

    // Insert a new message (instead of updating)
    const stmt = db.prepare("INSERT INTO messages (user_id, message) VALUES (?, ?)");
    stmt.run(user.id, message);

    // Send confirmation email
    const mailOptions = {
        from: "your-email@gmail.com",
        to: email,
        subject: "Message Received",
        text: `Hello ${name},\n\nWe have received your message:\n"${message}"\n\nThank you!\n`
    };

    transporter.sendMail(mailOptions)
        .then(() => res.status(200).json({ message: "Message submitted successfully!" }))
        .catch(error => res.status(500).json({ error: "Email sending failed" }));
});

// Define a route for the root URL
app.get('/', (req, res) => {
    res.send('Welcome to the XYZ Hotels!');
  });

// 📌 Route 3: Admin Page - View Database Content (Now Shows Timestamp)
app.get("/admin", (req, res) => {
    const stmt = db.prepare(`
        SELECT users.id, users.name, users.email, users.phone, messages.message, messages.created_at 
        FROM users 
        LEFT JOIN messages ON users.id = messages.user_id
        ORDER BY messages.created_at DESC
    `);
    const data = stmt.all();

    res.status(200).json(data);
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});