const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');

//Generate a hashed password for the admin
const hashedPassword =bcrypt.hashSync('admin123', 10); //Replace 'admin123' with ---

// Initialize the database
const db = new sqlite3.Database('users.db');

// Create tables and seed data
db.serialize(() => {
    // Clear existing data
    db.run(`DELETE FROM messages`);
    db.run(`DELETE FROM users`);

    // Create users table
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            phone TEXT NOT NULL,
            password TEXT NOT NULL,
            reset_token TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Create messages table
    db.run(`
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            message TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
    `);

    // Seed data
    db.run(`INSERT INTO users (name, email, phone) VALUES ('John Doe', 'john@example.com', '1234567890')`);
    db.run(`INSERT INTO messages (user_id, message) VALUES (1, 'Looking forward to my stay at XYZ Hotel!')`);
    db.run(`INSERT INTO messages (user_id, message) VALUES (1, 'Can I get a room with a sea view?')`);
    db.run(`INSERT INTO users (name, email, phone, password) VALUES ('Admin', 'jipent123@gmail.com', '08023040881', ?)`, [hashedPassword]);

    console.log('Database seeded successfully!');
});

db.close();