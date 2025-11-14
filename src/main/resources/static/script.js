function selectAlgorithm(type) {
    const text = {
        baseline: "FCFS (First-Come-First-Served): Serverer gæster i den rækkefølge de ankommer.",
        rushhour: "SCAN: Kører i én retning indtil ingen flere anmodninger, derefter vender om.",
        floorhogging: "Floor hogging: håndterer gentagne kald mellem få etager."
    };

    document.getElementById("currentAlgorithm").textContent = text[type] || "Ukendt algoritme";

    switch(type) {
        case 'baseline':
            runFCFSDemo();
            break;
        case 'rushhour':
            runSCANDemo();
            break;
        case 'floorhogging':
            runFloorHoggingDemo();
            break;
        default:
            drawElevator(type);
    }
}

/**
 * Run FCFS demonstration
 */
function runFCFSDemo() {
    console.clear();
    console.log('=== FCFS Algorithm Demo ===\n');

    const guests = generateTestScenario();
    const elevator = new FcfsElevator(10);

    guests.forEach(g => elevator.addGuest(g));

    const states = elevator.runComplete();
    const stats = elevator.getStats();

    console.log('Statistics:');
    console.log(`Total Steps: ${stats.totalSteps}`);
    console.log(`Average Wait Time: ${stats.averageWaitTime.toFixed(2)} steps`);
    console.log(`Max Wait Time: ${stats.maxWaitTime} steps`);
    console.log(`Average Total Time: ${stats.averageTotalTime.toFixed(2)} steps`);

    displayGuestDetails(elevator);

    drawElevator('FCFS');
}

/**
 * Run SCAN demonstration
 */
function runSCANDemo() {
    console.clear();
    console.log('=== SCAN Algorithm Demo ===\n');

    const guests = generateTestScenario();
    const elevator = new ScanElevator(10);

    guests.forEach(g => elevator.addGuest(g));

    const states = elevator.runComplete();
    const stats = elevator.getStats();

    console.log('Statistics:');
    console.log(`Total Steps: ${stats.totalSteps}`);
    console.log(`Average Wait Time: ${stats.averageWaitTime.toFixed(2)} steps`);
    console.log(`Max Wait Time: ${stats.maxWaitTime} steps`);
    console.log(`Average Total Time: ${stats.averageTotalTime.toFixed(2)} steps`);

    displayGuestDetails(elevator);

    drawElevator('SCAN');
}

/**
 * Run Floor Hogging demonstration
 */
function runFloorHoggingDemo() {
    console.clear();
    console.log('=== Comparing FCFS vs SCAN on Floor Hogging Scenario ===\n');

    const guests = generateFloorHoggingScenario();
    runComparison(guests);

    drawElevator('Floor Hogging Comparison');
}

function drawElevator(type) {
    const ctx = document.getElementById("elevatorCanvas").getContext("2d");
    ctx.clearRect(0, 0, 300, 400);

    // elevator shaft
    ctx.strokeStyle = "#aaa";
    ctx.strokeRect(120, 20, 60, 360);

    // elevator car
    ctx.fillStyle = "#888";
    ctx.fillRect(120, 300, 60, 80);

    // label
    ctx.fillStyle = "#222";
    ctx.font = "14px system-ui";
    ctx.fillText("Elevator: " + type, 10, 20);
}
