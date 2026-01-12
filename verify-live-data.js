const dbService = require('./src/services/dbService');
require('dotenv').config();

async function simulateGame() {
    console.log('Starting Live Data Verification...');

    try {
        // 1. Get or Create Session
        console.log('Checking for active session...');
        let session = await dbService.getPendingSession();
        if (!session) {
            console.log('No pending/active session. Creating one...');
            session = await dbService.createSession({
                durationSecond: 3600,
                maxPlayers: 10
            });
            // Set it to active so it shows up
            await dbService.updateSessionStatus(session.id, 'active');
            console.log('Created active session:', session.sessionCode);
        } else {
            console.log('Using existing session:', session.sessionCode);
            if (session.session_status !== 'active') {
                await dbService.updateSessionStatus(session.id, 'active');
                console.log('Set session to active.');
            }
        }

        // 2. Create Fake Players
        console.log('Creating fake players...');
        const teamA = await dbService.createPlayerContainer({
            container_url: 'http://fake-container-a',
            session_id: session.id
        });
        await dbService.updateContainerStatus(teamA.playerContainer_id, 'started');

        const teamB = await dbService.createPlayerContainer({
            container_url: 'http://fake-container-b',
            session_id: session.id
        });
        await dbService.updateContainerStatus(teamB.playerContainer_id, 'started');

        console.log(`Created Team A (Container ${teamA.containerCode}) and Team B (Container ${teamB.containerCode}) and set to 'started'`);

        // 3. Simulate Events
        console.log('Simulating events (watch the dashboard!)...');

        // Event 1: Team A scores
        await dbService.logBreach({
            playerContainer_id: teamA.playerContainer_id,
            point: 10,
            metaData: { level: 'Level 1' }
        });
        console.log('Team A breached Level 1 (+10pts)');

        await new Promise(r => setTimeout(r, 2000));

        // Event 2: Team B requests hint
        await dbService.logHint({
            playerContainer_id: teamB.playerContainer_id,
            point: -5,
            metaData: { level: 'Level 1' }
        });
        console.log('Team B used Hint on Level 1 (-5pts)');

        await new Promise(r => setTimeout(r, 2000));

        // Event 3: Team A scores again
        await dbService.logBreach({
            playerContainer_id: teamA.playerContainer_id,
            point: 20,
            metaData: { level: 'Level 2' }
        });
        console.log('Team A breached Level 2 (+20pts)');

        await new Promise(r => setTimeout(r, 2000));

        // Event 4: Team B scores
        await dbService.logBreach({
            playerContainer_id: teamB.playerContainer_id,
            point: 10,
            metaData: { level: 'Level 1' }
        });
        console.log('Team B breached Level 1 (+10pts)');

        console.log('\nVerification Complete!');
        console.log('Please check:');
        console.log('1. Admin Dashboard (http://localhost:3000/admin) -> Should show Live Events and Participants count');
        console.log('2. Home Page (http://localhost:3000/) -> Should show Leaderboard with Team A leading');

    } catch (err) {
        console.error('Simulation Failed:', err);
    } finally {
        process.exit(0);
    }
}

simulateGame();
