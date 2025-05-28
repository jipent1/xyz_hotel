const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');

// Always use the same logic for the database path everywhere:
const dbPath = process.env.DATABASE_URL || 'users.db';

function seedDatabase() {
    // Generate hashed passwords for default users
    const hashedPasswordAdmin = bcrypt.hashSync('admin123', 10);
    const hashedPasswordJohn = bcrypt.hashSync('johnpassword', 10);

    // Open database using the unified dbPath
    const db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
            console.error('Error opening database:', err);
        }
    });

    db.serialize(() => {
        // Clear existing data 
    /*   
    db.run(`DELETE FROM messages`);
    db.run(`DELETE FROM users`); */

        // Create users table if it doesn't exist
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

        // Create messages table if it doesn't exist
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

        // Insert default users if they don't already exist
        db.run(
            `INSERT OR IGNORE INTO users (id, name, email, phone, password) VALUES (?, ?, ?, ?, ?)`,
            [1, 'John Doe', 'john@example.com', '1234567890', hashedPasswordJohn],
            (err) => {
                if (err) console.error('Error inserting user John Doe:', err);
            }
        );

        db.run(
            `INSERT OR IGNORE INTO users (id, name, email, phone, password) VALUES (?, ?, ?, ?, ?)`,
            [2, 'Admin', 'jipent123@gmail.com', '08023040881', hashedPasswordAdmin],
            (err) => {
                if (err) console.error('Error inserting admin user:', err);
            }
        );

        // Insert default messages for John Doe (user_id = 1)
        db.run(
            `INSERT OR IGNORE INTO messages (id, user_id, message) VALUES (?, ?, ?)`,
            [1, 1, 'Looking forward to my stay at XYZ Hotel!'],
            (err) => {
                if (err) console.error('Error inserting message 1:', err);
            }
        );
        db.run(
            `INSERT OR IGNORE INTO messages (id, user_id, message) VALUES (?, ?, ?)`,
            [2, 1, 'Can I get a room with a sea view?'],
            (err) => {
                if (err) console.error('Error inserting message 2:', err);
            }
        );

        console.log('Database seeded successfully!');
    });

    db.close((err) => {
        if (err) {
            console.error('Error closing the database:', err);
        }
    });
}

// If this file is run directly, seed the database
if (require.main === module) {
    seedDatabase();
}

// Export for use elsewhere if needed
module.exports = seedDatabase;