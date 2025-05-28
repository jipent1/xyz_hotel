const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');

function seedDatabase() {
    // Generate hashed passwords
    const hashedPasswordAdmin = bcrypt.hashSync('admin123', 10);
    const hashedPasswordJohn = bcrypt.hashSync('johnpassword', 10);

    // Initialize the database
    const db = new sqlite3.Database('./users.db');

    db.serialize(() => {
        // Clear existing data
        db.run(`DELETE FROM messages`, (err) => {
            if (err) console.error('Error clearing messages table:', err);
        });
        db.run(`DELETE FROM users`, (err) => {
            if (err) console.error('Error clearing users table:', err);
        });

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
        `, (err) => {
            if (err) console.error('Error creating users table:', err);
        });

        // Create messages table
        db.run(`
            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                message TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(user_id) REFERENCES users(id)
            )
        `, (err) => {
            if (err) console.error('Error creating messages table:', err);
        });

        // Seed data with passwords
        db.run(`
            INSERT INTO users (name, email, phone, password) 
            VALUES ('John Doe', 'john@example.com', '1234567890', ?)
        `, [hashedPasswordJohn], (err) => {
            if (err) console.error('Error inserting user John Doe:', err);
        });

        db.run(`
            INSERT INTO users (name, email, phone, password) 
            VALUES ('Admin', 'jipent123@gmail.com', '08023040881', ?)
        `, [hashedPasswordAdmin], (err) => {
            if (err) console.error('Error inserting admin user:', err);
        });

        db.run(`
            INSERT INTO messages (user_id, message) 
            VALUES (1, 'Looking forward to my stay at XYZ Hotel!')
        `, (err) => {
            if (err) console.error('Error inserting message 1:', err);
        });

        db.run(`
            INSERT INTO messages (user_id, message) 
            VALUES (1, 'Can I get a room with a sea view?')
        `, (err) => {
            if (err) console.error('Error inserting message 2:', err);
        });

        console.log('Database seeded successfully!');
    });

    db.close((err) => {
        if (err) {
            console.error('Error closing the database:', err);
        } else {
            console.log('Database connection closed.');
        }
    });
}
module.exports = seedDatabase;