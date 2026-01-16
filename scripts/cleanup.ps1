$ErrorActionPreference = "SilentlyContinue"

Write-Host "Stopping Docker Compose services..."
docker compose down

Write-Host "Cleaning up dynamic MITS containers..."
# Remove Player Containers
$players = docker ps -aq --filter "label=type=MITS-PLAYER"
if ($players) { 
    docker rm -f $players 
    Write-Host "Removed player containers."
}

# Remove Attacker Containers
$attackers = docker ps -aq --filter "label=type=MITS-ATTACKER"
if ($attackers) { 
    docker rm -f $attackers 
    Write-Host "Removed attacker containers."
}

# Remove Victim Containers (if any stray ones exist outside compose)
$victims = docker ps -aq --filter "label=type=MITS-VICTIM"
if ($victims) {
    docker rm -f $victims
    Write-Host "Removed dynamic victim containers."
}

Write-Host "Cleanup complete."
