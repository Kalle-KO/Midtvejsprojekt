class ElevatorVisualizer {
    constructor(canvasId, elevator, color, numFloors = 10) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.elevator = elevator;
        this.color = color;
        this.numFloors = numFloors;
        this.animationId = null;
        this.animationSpeed = 300;
        this.isRunning = false;

        this.pickupRequests = new Map(); // Map<floor, Array<{destination, stepNumber}>>
        this.onboardPassengers = new Map(); // Map<destination, Array<{destination, stepNumber}>>
        this.waitTimes = [];
        this.servedCount = 0;

        // Drop-off animation
        this.dropoffAnimations = []; // Array of {floor, progress, maxProgress}
    }

    draw() {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;

        ctx.clearRect(0, 0, width, height);

        const floorHeight = (height - 40) / this.numFloors;
        const shaftX = width / 2 - 25;
        const shaftWidth = 50;

        ctx.strokeStyle = '#ddd';
        ctx.lineWidth = 1;
        for (let i = 0; i <= this.numFloors; i++) {
            const y = height - 20 - (i * floorHeight);
            ctx.beginPath();
            ctx.moveTo(shaftX - 20, y);
            ctx.lineTo(shaftX + shaftWidth + 20, y);
            ctx.stroke();

            ctx.fillStyle = '#666';
            ctx.font = '11px monospace';
            ctx.fillText(String(i + 1), shaftX - 35, y + 4);
        }

        ctx.strokeStyle = '#999';
        ctx.lineWidth = 2;
        ctx.strokeRect(shaftX, 20, shaftWidth, height - 40);

        let currentFloor = this.elevator.currentFloor;

        const elevatorY = height - 20 - ((currentFloor - 1) * floorHeight) - floorHeight + 8;
        ctx.fillStyle = this.color;
        ctx.fillRect(shaftX + 4, elevatorY, shaftWidth - 8, floorHeight - 16);

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px sans-serif';
        let arrow = '●';
        if (this.elevator.direction === 'UP') {
            arrow = '↑';
        } else if (this.elevator.direction === 'DOWN') {
            arrow = '↓';
        }
        ctx.textAlign = 'center';
        ctx.fillText(arrow, shaftX + shaftWidth / 2, elevatorY + floorHeight / 2 + 2);
        ctx.textAlign = 'left';

        // Draw drop-off animations
        this.dropoffAnimations = this.dropoffAnimations.filter(anim => {
            anim.progress++;

            const animFloorY = height - 20 - ((anim.floor - 1) * floorHeight) - floorHeight / 2;
            const progress = anim.progress / anim.maxProgress;

            // Move left and fade out
            const xOffset = progress * 30; // Move 30 pixels to the left
            const opacity = 1 - progress;

            // Vertical offset for staggering
            const yOffset = anim.verticalOffset;

            // Draw blue dot
            ctx.save();
            ctx.globalAlpha = opacity;
            ctx.fillStyle = '#2196F3'; // Blue color
            ctx.beginPath();
            ctx.arc(shaftX - xOffset, animFloorY + yOffset, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            // Keep animation if not finished
            return anim.progress < anim.maxProgress;
        });

        // Draw waiting guests with destination indicators
        const pickupCounts = new Map();
        this.pickupRequests.forEach((requests, floor) => {
            pickupCounts.set(floor, requests);
        });

        pickupCounts.forEach((requests, floor) => {
            const floorY = height - 20 - ((floor - 1) * floorHeight) - floorHeight / 2;
            const startX = shaftX + shaftWidth + 8;
            const guestRadius = 5;
            const horizontalSpacing = 11;
            const verticalSpacing = 11;
            const maxPerRow = 3;
            const maxToShow = 12;

            let index = 0;
            for (let i = 0; i < Math.min(requests.length, maxToShow); i++) {
                const row = Math.floor(index / maxPerRow);
                const col = index % maxPerRow;
                const xPos = startX + (col * horizontalSpacing);
                const yPos = floorY - 15 + (row * verticalSpacing);

                // Draw guest dot (red circle)
                ctx.fillStyle = '#FF5722';
                ctx.beginPath();
                ctx.arc(xPos, yPos, guestRadius, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#D84315';
                ctx.lineWidth = 1;
                ctx.stroke();

                index++;
            }

            // Show overflow count
            if (requests.length > maxToShow) {
                ctx.fillStyle = '#333';
                ctx.font = 'bold 11px sans-serif';
                ctx.fillText(`+${requests.length - maxToShow}`, startX + 70, floorY + 5);
            }
        });
    }

    trackRequest(pickup, destination, currentStep) {
        if (!this.pickupRequests.has(pickup)) {
            this.pickupRequests.set(pickup, []);
        }
        this.pickupRequests.get(pickup).push({
            destination: destination,
            stepNumber: currentStep
        });
    }

    trackPickup(floor, currentStep) {
        if (this.pickupRequests.has(floor)) {
            const requests = this.pickupRequests.get(floor);
            if (requests.length > 0) {
                // Remove oldest pickup request
                const req = requests.shift();

                // Add to onboard tracking
                if (!this.onboardPassengers.has(req.destination)) {
                    this.onboardPassengers.set(req.destination, []);
                }
                this.onboardPassengers.get(req.destination).push({
                    destination: req.destination,
                    stepNumber: req.stepNumber
                });

                if (requests.length === 0) {
                    this.pickupRequests.delete(floor);
                }
            }
        }
    }

    trackDropoff(floor, currentStep) {
        if (this.onboardPassengers.has(floor)) {
            const passengers = this.onboardPassengers.get(floor);
            if (passengers.length > 0) {
                // Remove oldest passenger and calculate wait time
                const passenger = passengers.shift();
                const waitTime = currentStep - passenger.stepNumber;
                this.waitTimes.push(waitTime);
                this.servedCount++;

                // Count existing animations at this floor to stagger them
                const existingAtFloor = this.dropoffAnimations.filter(a => a.floor === floor).length;
                const verticalSpacing = 8; // 8 pixels apart
                const verticalOffset = (existingAtFloor % 3) * verticalSpacing - verticalSpacing; // Stagger up to 3 dots

                // Trigger drop-off animation
                this.dropoffAnimations.push({
                    floor: floor,
                    progress: 0,
                    maxProgress: 10, // Animation lasts 10 frames
                    verticalOffset: verticalOffset
                });

                if (passengers.length === 0) {
                    this.onboardPassengers.delete(floor);
                }
            }
        }
    }

    getMetrics() {
        const avgWait = this.waitTimes.length > 0
            ? Math.round(this.waitTimes.reduce((a, b) => a + b, 0) / this.waitTimes.length)
            : 0;

        const maxWait = this.waitTimes.length > 0
            ? Math.max(...this.waitTimes)
            : 0;

        return {
            avgWait,
            maxWait,
            served: this.servedCount,
            totalMoves: this.elevator.totalMoves || 0
        };
    }

    start() {
        this.isRunning = true;
        this.animate();
    }

    animate() {
        if (!this.isRunning) return;

        const result = this.elevator.step();

        // Track each served request
        if (result.served) {
            if (result.servedType === 'pickup') {
                this.trackPickup(this.elevator.currentFloor, this.elevator.stepCount);
            } else if (result.servedType === 'dropoff') {
                this.trackDropoff(this.elevator.currentFloor, this.elevator.stepCount);
            }
        }

        // Draw after step
        this.draw();

        // Check if elevator has requests
        let hasRequests = this.elevator.pickupQueue.length > 0 ||
                          this.elevator.onboardQueue.length > 0;

        const hasTrackedRequests = this.pickupRequests.size > 0 ||
                                   this.onboardPassengers.size > 0;

        if (hasRequests || hasTrackedRequests || continuousMode) {
            this.animationId = setTimeout(() => this.animate(), this.animationSpeed);
        } else {
            this.isRunning = false;
        }
    }

    stop() {
        this.isRunning = false;
        if (this.animationId) {
            clearTimeout(this.animationId);
            this.animationId = null;
        }
    }

    reset() {
        this.stop();
        this.waitTimes = [];
        this.servedCount = 0;
        this.pickupRequests.clear();
        this.onboardPassengers.clear();
        this.dropoffAnimations = [];
        this.elevator.reset();
        this.draw();
    }
}

const ScenarioGenerator = {
    baseline: (numFloors = 10) => {
        // BALANCED: Random requests across all floors
        const requests = [];
        for (let i = 0; i < 20; i++) {
            const pickup = Math.floor(Math.random() * numFloors) + 1;
            let destination;
            do {
                destination = Math.floor(Math.random() * numFloors) + 1;
            } while (destination === pickup);

            requests.push({ pickup, destination });
        }

        return {
            requests,
            description: '⚖️ Balanced Random Traffic',
            detail: '20 random pickup-destination pairs. Baseline comparison ',
            pattern: 'random' // For continuous mode
        };
    },

    rushhour: (numFloors = 10) => {
        // BUILDING RUSH WITH STRAGGLERS: Dense cluster at bottom going up
        const requests = [];

        // Heavy traffic from lower floors going to mid-upper floors (10 requests)
        const bottomFloors = [1, 1, 2, 2, 2, 3, 3, 1, 2, 3];
        bottomFloors.forEach(pickup => {
            // People from lower floors going to mid-upper floors
            const destination = Math.floor(Math.random() * 5) + 5; // floors 5-9
            requests.push({ pickup, destination });
        });

        // Add mid-level traffic (2 requests)
        requests.push({ pickup: 5, destination: 8 });
        requests.push({ pickup: 6, destination: 2 });

        return {
            requests,
            description: '🏢 Building Rush with Stragglers',
            detail: 'Morning rush: Heavy lobby traffic going up, sparse mid-level movement. ',
            pattern: 'rushhour'
        };
    },

    floorhogging: () => {
        // FLOOR HOGGING: Multiple requests to/from same popular floors
        const requests = [];

        // Floor 1 (Lobby) - 5 requests going to floor 5
        for (let i = 0; i < 5; i++) {
            requests.push({ pickup: 1, destination: 5 });
        }

        // Floor 5 (Popular Office) - 7 short trips
        for (let i = 0; i < 7; i++) {
            const destination = Math.random() < 0.5 ? 4 : 6; // Short hops to 4 or 6
            requests.push({ pickup: 5, destination });
        }

        // Scattered requests (3)
        requests.push({ pickup: 3, destination: 8 });
        requests.push({ pickup: 8, destination: 2 });
        requests.push({ pickup: 10, destination: 1 });

        return {
            requests,
            description: '🏢 Floor Hogging',
            detail: 'Multiple short trips: 5x (1→5), 7x short hops from floor 5.',
            pattern: 'floorhogging'
        };
    }
};

let visualizers = {};
let updateInterval = null;
let continuousMode = false;
let continuousInterval = null;
let currentScenarioPattern = 'random'; // Track current scenario for continuous mode

document.addEventListener('DOMContentLoaded', () => {
    const numFloors = 10;

    visualizers.sstf = new ElevatorVisualizer(
        'canvas-sstf',
        new SstfElevator(numFloors),
        '#4CAF50',
        numFloors
    );

    visualizers.scan = new ElevatorVisualizer(
        'canvas-scan',
        new ScanElevator(numFloors),
        '#2196F3',
        numFloors
    );

    visualizers.fcfs = new ElevatorVisualizer(
        'canvas-fcfs',
        new FcfsElevator(numFloors),
        '#FF9800',
        numFloors
    );

    Object.values(visualizers).forEach(v => v.draw());

    document.getElementById('speedSlider').addEventListener('input', (e) => {
        const speed = parseInt(e.target.value);
        document.getElementById('speedValue').textContent = speed + 'ms';
        Object.values(visualizers).forEach(v => {
            v.animationSpeed = speed;
        });
    });
});

function runScenario(scenarioName) {
    stopContinuous();

    const scenario = ScenarioGenerator[scenarioName](10);
    currentScenarioPattern = scenario.pattern || 'random'; // Store pattern for continuous mode

    document.getElementById('scenarioDescription').innerHTML = `
        <h4>${scenario.description}</h4>
        <p>${scenario.detail}</p>
    `;

    Object.values(visualizers).forEach(v => v.reset());

    scenario.requests.forEach(req => {
        visualizers.sstf.elevator.addRequest(req.pickup, req.destination);
        visualizers.sstf.trackRequest(req.pickup, req.destination, visualizers.sstf.elevator.stepCount);

        visualizers.scan.elevator.addRequest(req.pickup, req.destination);
        visualizers.scan.trackRequest(req.pickup, req.destination, visualizers.scan.elevator.stepCount);

        visualizers.fcfs.elevator.addRequest(req.pickup, req.destination);
        visualizers.fcfs.trackRequest(req.pickup, req.destination, visualizers.fcfs.elevator.stepCount);
    });

    Object.values(visualizers).forEach(v => v.start());

    if (continuousMode) {
        startContinuous();
    }

    updateInterval = setInterval(updateMetrics, 100);
}

function addRandomRequests() {
    const numRequests = Math.floor(Math.random() * 2) + 2; // 2-3 requests

    for (let i = 0; i < numRequests; i++) {
        let pickup, destination;

        // Generate requests based on current scenario pattern
        if (currentScenarioPattern === 'rushhour') {
            if (Math.random() < 0.7) {
                // 70% from top floors going down
                pickup = Math.floor(Math.random() * 3) + 8;  // 8-10
                destination = Math.floor(Math.random() * 4) + 1;  // 1-4
            } else {
                // 30% from bottom going up
                pickup = Math.floor(Math.random() * 3) + 1;  // 1-3
                destination = Math.floor(Math.random() * 5) + 5;  // 5-9
            }
        } else if (currentScenarioPattern === 'floorhogging') {
            const rand = Math.random();
            if (rand < 0.6) {
                // 60% to/from floor 5
                pickup = 5;
                destination = Math.random() < 0.5 ? 4 : 6;
            } else if (rand < 0.9) {
                // 30% from lobby to floor 5
                pickup = 1;
                destination = 5;
            } else {
                // 10% random
                pickup = Math.floor(Math.random() * 10) + 1;
                do {
                    destination = Math.floor(Math.random() * 10) + 1;
                } while (destination === pickup);
            }
        } else {
            // Random/baseline
            pickup = Math.floor(Math.random() * 10) + 1;
            do {
                destination = Math.floor(Math.random() * 10) + 1;
            } while (destination === pickup);
        }

        visualizers.sstf.elevator.addRequest(pickup, destination);
        visualizers.sstf.trackRequest(pickup, destination, visualizers.sstf.elevator.stepCount);

        visualizers.scan.elevator.addRequest(pickup, destination);
        visualizers.scan.trackRequest(pickup, destination, visualizers.scan.elevator.stepCount);

        visualizers.fcfs.elevator.addRequest(pickup, destination);
        visualizers.fcfs.trackRequest(pickup, destination, visualizers.fcfs.elevator.stepCount);
    }
}

function startContinuous() {
    if (!continuousInterval) {
        continuousInterval = setInterval(() => {
            addRandomRequests();
        }, 2000); // Every 2 seconds
    }
}

function stopContinuous() {
    if (continuousInterval) {
        clearInterval(continuousInterval);
        continuousInterval = null;
    }
}

function toggleContinuousMode() {
    const checkbox = document.getElementById('continuousToggle');
    continuousMode = checkbox.checked;

    if (continuousMode) {
        startContinuous();
        Object.values(visualizers).forEach(v => {
            if (!v.isRunning) {
                v.start();
            }
        });
    } else {
        stopContinuous();
    }
}

function stopAll() {
    continuousMode = false;
    const checkbox = document.getElementById('continuousToggle');
    if (checkbox) {
        checkbox.checked = false;
    }

    stopContinuous();

    if (updateInterval) {
        clearInterval(updateInterval);
        updateInterval = null;
    }

    Object.values(visualizers).forEach(v => v.stop());
}

function updateMetrics() {
    ['sstf', 'scan', 'fcfs'].forEach(alg => {
        const viz = visualizers[alg];
        const elevator = viz.elevator;
        const metrics = viz.getMetrics();

        document.getElementById(`floor-${alg}`).textContent = elevator.currentFloor;
        document.getElementById(`direction-${alg}`).textContent = elevator.direction;

        // Get pending count
        let pendingPickups = 0;
        let onboard = 0;
        if (elevator.pickupQueue !== undefined) {
            pendingPickups = elevator.pickupQueue.length;
            onboard = elevator.onboardQueue.length;
        }
        document.getElementById(`pending-${alg}`).textContent = `${pendingPickups} waiting`;

        document.getElementById(`moves-${alg}`).textContent = metrics.totalMoves;
        document.getElementById(`avgwait-${alg}`).textContent = metrics.avgWait + ' steps';
        document.getElementById(`maxwait-${alg}`).textContent = metrics.maxWait + ' steps';
        document.getElementById(`served-${alg}`).textContent = metrics.served;
    });
}