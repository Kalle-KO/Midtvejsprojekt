/**
 * Test and comparison file for elevator algorithms
 * Creates a shared guest scenario to test FCFS vs SCAN
 */

/**
 * Generate a standard test scenario with guests
 * @returns {Array<Guest>} - Array of Guest objects
 */
function generateTestScenario() {
    Guest.nextId = 1; // Reset guest ID counter

    const guests = [
        new Guest(0, 7, 0),   // Guest 1: Floor 0 → 7, arrives at step 0
        new Guest(3, 1, 2),   // Guest 2: Floor 3 → 1, arrives at step 2
        new Guest(5, 9, 3),   // Guest 3: Floor 5 → 9, arrives at step 3
        new Guest(2, 8, 5),   // Guest 4: Floor 2 → 8, arrives at step 5
        new Guest(7, 0, 7),   // Guest 5: Floor 7 → 0, arrives at step 7
        new Guest(9, 3, 10),  // Guest 6: Floor 9 → 3, arrives at step 10
        new Guest(1, 6, 12),  // Guest 7: Floor 1 → 6, arrives at step 12
        new Guest(8, 2, 15),  // Guest 8: Floor 8 → 2, arrives at step 15
        new Guest(4, 5, 18),  // Guest 9: Floor 4 → 5, arrives at step 18
        new Guest(6, 4, 20)   // Guest 10: Floor 6 → 4, arrives at step 20
    ];

    return guests;
}

/**
 * Generate a rush hour scenario (lots of guests going up from ground floor)
 * @returns {Array<Guest>}
 */
function generateRushHourScenario() {
    Guest.nextId = 1;

    const guests = [
        new Guest(0, 5, 0),
        new Guest(0, 7, 1),
        new Guest(0, 3, 2),
        new Guest(0, 9, 3),
        new Guest(0, 4, 4),
        new Guest(0, 6, 5),
        new Guest(1, 8, 7),
        new Guest(2, 9, 10),
        new Guest(0, 8, 12),
        new Guest(1, 5, 15)
    ];

    return guests;
}

/**
 * Generate a floor hogging scenario (guests bouncing between few floors)
 * @returns {Array<Guest>}
 */
function generateFloorHoggingScenario() {
    Guest.nextId = 1;

    const guests = [
        new Guest(3, 5, 0),
        new Guest(5, 3, 2),
        new Guest(3, 5, 5),
        new Guest(5, 3, 7),
        new Guest(4, 5, 10),
        new Guest(5, 4, 12),
        new Guest(3, 4, 15),
        new Guest(4, 3, 18),
        new Guest(5, 3, 20),
        new Guest(3, 5, 22)
    ];

    return guests;
}

/**
 * Run comparison test between FCFS and SCAN
 * @param {Array<Guest>} guestScenario - Array of guests to test
 */
function runComparison(guestScenario) {
    console.log('\n=== ELEVATOR ALGORITHM COMPARISON ===\n');
    console.log(`Testing with ${guestScenario.length} guests\n`);

    // Test FCFS
    console.log('--- FCFS Algorithm ---');
    const fcfs = new FcfsElevator(10);
    const fcfsGuests = JSON.parse(JSON.stringify(guestScenario.map(g => ({
        startFloor: g.startFloor,
        destinationFloor: g.destinationFloor,
        arrivalStep: g.arrivalStep
    }))));

    Guest.nextId = 1;
    fcfsGuests.forEach(data => {
        fcfs.addGuest(new Guest(data.startFloor, data.destinationFloor, data.arrivalStep));
    });

    const fcfsStates = fcfs.runComplete();
    const fcfsStats = fcfs.getStats();

    console.log(`Total Steps: ${fcfsStats.totalSteps}`);
    console.log(`Average Wait Time: ${fcfsStats.averageWaitTime.toFixed(2)} steps`);
    console.log(`Max Wait Time: ${fcfsStats.maxWaitTime} steps`);
    console.log(`Average Total Time: ${fcfsStats.averageTotalTime.toFixed(2)} steps`);
    console.log(`Guests Delivered: ${fcfsStats.guestsDelivered}`);

    // Test SCAN
    console.log('\n--- SCAN Algorithm ---');
    const scan = new ScanElevator(10);
    const scanGuests = JSON.parse(JSON.stringify(guestScenario.map(g => ({
        startFloor: g.startFloor,
        destinationFloor: g.destinationFloor,
        arrivalStep: g.arrivalStep
    }))));

    Guest.nextId = 1;
    scanGuests.forEach(data => {
        scan.addGuest(new Guest(data.startFloor, data.destinationFloor, data.arrivalStep));
    });

    const scanStates = scan.runComplete();
    const scanStats = scan.getStats();

    console.log(`Total Steps: ${scanStats.totalSteps}`);
    console.log(`Average Wait Time: ${scanStats.averageWaitTime.toFixed(2)} steps`);
    console.log(`Max Wait Time: ${scanStats.maxWaitTime} steps`);
    console.log(`Average Total Time: ${scanStats.averageTotalTime.toFixed(2)} steps`);
    console.log(`Guests Delivered: ${scanStats.guestsDelivered}`);

    // Comparison
    console.log('\n--- Comparison ---');
    const stepDiff = ((fcfsStats.totalSteps - scanStats.totalSteps) / fcfsStats.totalSteps * 100).toFixed(1);
    const waitDiff = ((fcfsStats.averageWaitTime - scanStats.averageWaitTime) / fcfsStats.averageWaitTime * 100).toFixed(1);

    console.log(`SCAN was ${Math.abs(stepDiff)}% ${stepDiff > 0 ? 'faster' : 'slower'} in total steps`);
    console.log(`SCAN had ${Math.abs(waitDiff)}% ${waitDiff > 0 ? 'better' : 'worse'} average wait time`);

    return {
        fcfs: { states: fcfsStates, stats: fcfsStats },
        scan: { states: scanStates, stats: scanStats }
    };
}

/**
 * Run all test scenarios
 */
function runAllTests() {
    console.log('\n========================================');
    console.log('STANDARD SCENARIO');
    console.log('========================================');
    runComparison(generateTestScenario());

    console.log('\n========================================');
    console.log('RUSH HOUR SCENARIO');
    console.log('========================================');
    runComparison(generateRushHourScenario());

    console.log('\n========================================');
    console.log('FLOOR HOGGING SCENARIO');
    console.log('========================================');
    runComparison(generateFloorHoggingScenario());
}

/**
 * Display detailed guest journey information
 * @param {Object} elevator - Elevator instance (FCFS or SCAN)
 */
function displayGuestDetails(elevator) {
    const details = elevator.getGuestDetails();

    console.log('\n=== Guest Journey Details ===');
    console.log('ID | From → To | Arrival | Pickup | Dropoff | Wait | Total');
    console.log('---|-----------|---------|--------|---------|------|------');

    details.forEach(g => {
        console.log(
            `${String(g.id).padStart(2)} | ` +
            `${g.from} → ${g.to}     | ` +
            `${String(g.arrivalStep).padStart(7)} | ` +
            `${String(g.pickupStep).padStart(6)} | ` +
            `${String(g.dropoffStep).padStart(7)} | ` +
            `${String(g.waitTime).padStart(4)} | ` +
            `${String(g.totalTime).padStart(5)}`
        );
    });
}

// Example usage - uncomment to run tests
// runAllTests();

// Example: Run a single test
// const testGuests = generateTestScenario();
// const results = runComparison(testGuests);
