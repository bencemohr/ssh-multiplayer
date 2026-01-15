// Configure for local execution (outside Docker)
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '8002';
// Ensure other env vars are loaded
require('dotenv').config();

const dbService = require('./src/services/dbService');

async function seedFakePlayers() {
    console.log('Seeding fake player data...');

    try {
        // 1. Get or Create Session
        console.log('Checking for active session...');
        let session = await dbService.getPendingSession();
        if (!session) {
            console.log('No pending/active session. Creating one...');
            session = await dbService.createSession({
                durationSecond: 3600,
                maxPlayers: 20
            });
            await dbService.updateSessionStatus(session.id, 'active');
            console.log('Created active session:', session.sessionCode);
        } else {
            console.log('Using existing session:', session.sessionCode);
            if (session.session_status !== 'active') {
                await dbService.updateSessionStatus(session.id, 'active');
            }
        }

        // 2. Create Fake Players
        const players = [
            { code: 'ALPHA', score: 1500, status: 'running' },
            { code: 'BRAVO', score: 950, status: 'running' },
            { code: 'CHARLIE', score: 2100, status: 'running' },
            { code: 'DELTA', score: 0, status: 'created' },
            { code: 'ECHO', score: 450, status: 'stopped' },
        ];

        console.log(`Creating ${players.length} fake players...`);

        for (const p of players) {
            // Create container record
            const container = await dbService.createPlayerContainer({
                container_url: `http://fake-container-${p.code.toLowerCase()}`,
                session_id: session.id
            });

            // Update status
            await dbService.updateContainerStatus(container.playerContainer_id, p.status);

            // Set Score (Hack: manually updating score since createPlayerContainer inits at 0)
            if (p.score > 0) {
                await dbService.query(
                    'UPDATE "playerContainer" SET "totalScore" = $1 WHERE "playerContainer_id" = $2',
                    [p.score, container.playerContainer_id]
                );
            }

            console.log(` -> Created Player ${p.code} (Status: ${p.status}, Score: ${p.score})`);
        }

        console.log('\nSeed Complete!');
        console.log('Go to http://localhost:3000/admin/players to see the data.');

    } catch (err) {
        console.error('Seeding Failed:', err);
    } finally {
        process.exit(0);
    }
}

seedFakePlayers();
