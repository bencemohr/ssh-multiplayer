
const dbService = require('./src/services/dbService');

async function verify() {
    console.log("--- Starting Verification ---");

    // 1. Check Sessions
    console.log("Checking sessions...");
    const session = await dbService.getPendingSession();
    console.log("Latest Pending/Active Session:", session);

    if (!session) {
        console.warn("WARNING: No active or pending session found! Ghost containers will default to ID 1, which might fail.");
    }

    // 2. Simulate Ghost Container Logic
    const remote_ip = "192.168.1.999"; // Non-existent IP
    console.log(`\nSimulating Breach from unknown IP: ${remote_ip}`);

    let playerContainer_id = null;

    try {
        const pContainer = await dbService.getPlayerContainerByIp(remote_ip);
        if (pContainer) {
            console.log("Found existing info (unexpected for test IP):", pContainer);
        } else {
            console.log("No existing container. Creating Ghost...");
            const ghost = await dbService.createPlayerContainer({
                container_url: `http://${remote_ip}:3000`,
                session_id: session ? session.id : 1,
                status: 'ghost',
                ip_address: remote_ip
            });
            playerContainer_id = ghost.playerContainer_id;
            console.log("Ghost Created Successfully. ID:", playerContainer_id);
        }

        // 3. Log Breach
        console.log("Logging Breach...");
        const log = await dbService.logBreach({
            playerContainer_id: playerContainer_id,
            point: 10,
            metaData: { remote_ip, username: 'test_user', container_id: 'test_container', timestamp: new Date() }
        });
        console.log("Breach Logged Successfully:", log);

    } catch (err) {
        console.error("Verification Attempt Failed:", err);
    }

    process.exit(0);
}

verify();
