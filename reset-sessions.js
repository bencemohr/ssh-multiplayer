const dbService = require('./src/services/dbService');
require('dotenv').config();

async function resetSessions() {
    console.log('Resetting all active/pending sessions to completed...');
    try {
        const result = await dbService.query(
            `UPDATE "session" SET session_status = 'completed', "destroyedAt" = NOW() WHERE session_status IN ('active', 'pending') RETURNING *`
        );
        console.log(`Updated ${result.rowCount} sessions to completed.`);
    } catch (err) {
        console.error('Error resetting sessions:', err);
    } finally {
        process.exit(0);
    }
}

resetSessions();
