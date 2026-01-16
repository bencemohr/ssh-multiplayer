const dbService = require('./src/services/dbService');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const fs = require('fs');

function getAdminPassword() {
    const direct = process.env.ADMIN_PASSWORD;
    if (direct && String(direct).trim()) return String(direct).trim();

    const filePath = process.env.ADMIN_PASSWORD_FILE;
    if (filePath && fs.existsSync(filePath)) {
        const fromFile = fs.readFileSync(filePath, 'utf8').trim();
        if (fromFile) return fromFile;
    }

    return require('crypto').randomBytes(18).toString('base64url');
}

function getPasswordSource() {
    const direct = process.env.ADMIN_PASSWORD;
    if (direct && String(direct).trim()) return 'env';

    const filePath = process.env.ADMIN_PASSWORD_FILE;
    if (filePath && fs.existsSync(filePath)) {
        const fromFile = fs.readFileSync(filePath, 'utf8').trim();
        if (fromFile) return 'file';
    }

    return 'random';
}

async function seedAdmin() {
    console.log('Seeding initial admin user...');
    try {
        const adminId = 1; // Simple ID for the first admin
        const username = (process.env.ADMIN_NICKNAME || 'admin').trim();
        const rawPassword = getAdminPassword();
        const passwordSource = getPasswordSource();
        const forceReset = String(process.env.ADMIN_FORCE_RESET || '').toLowerCase() === 'true';

        // In Docker Compose we always have a deterministic password source (file/env).
        // Sync the DB hash to that password every run so DB and password-file cannot drift.
        // Only skip updates for the fallback random-password case (local dev), unless forced.
        const existing = await dbService.query('SELECT "admin_id" FROM "admin" WHERE "admin_id" = $1 LIMIT 1', [adminId]);
        if (existing.rows.length > 0 && passwordSource === 'random' && !forceReset) {
            console.log('Admin already exists; skipping password update (set ADMIN_FORCE_RESET=true to rotate).');
            return;
        }

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
