const sqlite3 = require('sqlite3').verbose(); // Import SQLite3 library
const db = new sqlite3.Database('users.db'); // Connect to the database

// Seed the database
db.serialize(() => {
    // Create the "users" table if it doesn't already exist
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            phone TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);

    // Create the "messages" table if it doesn't already exist
    db.run(`
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            message TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id)
        );
    `);

    // Insert sample data into the "users" table
    db.run(`
        INSERT OR IGNORE INTO users (name, email, phone)
        VALUES 
        ('Jim Nwachukwu', 'jimnwachukwu@yahoo.com', '07034711075'),
        ('Jane Doe', 'janedoe@gmail.com', '08012345678'),
        ('John Smith', 'johnsmith@gmail.com', '08123456789');
    `);

    // Insert sample data into the "messages" table
    db.run(`
        INSERT OR IGNORE INTO messages (user_id, message)
        VALUES 
        (1, 'Welcome to XYZ Hotels, a home away from home'),
        (2, 'Looking forward to my next stay!'),
        (3, 'Great hospitality and excellent service.');
    `);

    console.log('Database seeding complete!');
});

// Close the database connection
db.close();