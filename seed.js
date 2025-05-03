const sqlite3 = require('sqlite3').verbose();

// Initialize the database
const db = new sqlite3.Database('users.db');

// Create tables and seed data
db.serialize(() => {
    // Create users table
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            phone TEXT NOT NULL,
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

    console.log('Database seeded successfully!');
});

db.close();