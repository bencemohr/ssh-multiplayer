const dbService = require('./src/services/dbService');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function seedAdmin() {
    console.log('Seeding initial admin user...');
    try {
        const adminId = 1; // Simple ID for the first admin
        const username = 'admin';
        const rawPassword = 'password123';

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(rawPassword, salt);

        const queryText = `
            INSERT INTO "admin" ("admin_id", "nickName", "hashedPassword")
            VALUES ($1, $2, $3)
            ON CONFLICT ("admin_id") 
            DO UPDATE SET "hashedPassword" = $3, "nickName" = $2
            RETURNING *
        `;

        const res = await dbService.query(queryText, [adminId, username, hashedPassword]);
        console.log('Admin user seeded successfully:', res.rows[0].nickName);

    } catch (err) {
        console.error('Error seeding admin:', err);
    } finally {
        process.exit(0);
    }
}

seedAdmin();
