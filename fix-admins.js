const dbService = require('./src/services/dbService');
require('dotenv').config();

async function fixAdmins() {
    console.log('Fixing Admin Users...');
    try {
        // Delete everyone except ID 1
        const res = await dbService.query('DELETE FROM "admin" WHERE admin_id != 1', []);
        console.log(`Deleted ${res.rowCount} invalid admin(s).`);

        // Verify
        const verify = await dbService.query('SELECT * FROM "admin"', []);
        console.log(`Remaining admins: ${verify.rowCount}`);
        verify.rows.forEach(r => console.log(`ID: ${r.admin_id}, Name: ${r.nickName}`));

    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit(0);
    }
}

fixAdmins();
