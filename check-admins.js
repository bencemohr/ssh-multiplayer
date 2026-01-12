const dbService = require('./src/services/dbService');
require('dotenv').config();

async function checkAdmins() {
    console.log('Checking Admin Users...');
    try {
        const res = await dbService.query('SELECT * FROM "admin"', []);
        console.log(`Found ${res.rowCount} admin(s):`);
        res.rows.forEach(r => {
            console.log(`ID: ${r.admin_id}, Name: ${r.nickName}, Hash: ${r.hashedPassword.substring(0, 15)}...`);
        });
    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit(0);
    }
}

checkAdmins();
