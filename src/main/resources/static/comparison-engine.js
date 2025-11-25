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

        this.requestSteps = new Map(); // Map<floor, Array<stepNumber>>
        this.waitTimes = [];
        this.servedCount = 0;
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

    
        const floorCounts = new Map();
        this.requestSteps.forEach((steps, floor) => {
            floorCounts.set(floor, steps.length);
        });

        floorCounts.forEach((count, floor) => {
            const floorY = height - 20 - ((floor - 1) * floorHeight) - floorHeight / 2;
            const startX = shaftX + shaftWidth + 8;
            const guestRadius = 5;
            const horizontalSpacing = 11;
            const verticalSpacing = 11;
            const maxPerRow = 3;
            const maxToShow = 12;

            for (let i = 0; i < Math.min(count, maxToShow); i++) {
                const row = Math.floor(i / maxPerRow);
                const col = i % maxPerRow;
                const xPos = startX + (col * horizontalSpacing);
                const yPos = floorY - 15 + (row * verticalSpacing);

                // Draw guest as filled circle with outline
                ctx.fillStyle = '#FF5722';
                ctx.beginPath();
                ctx.arc(xPos, yPos, guestRadius, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#D84315';
                ctx.lineWidth = 1;
                ctx.stroke();
            }

            if (count > maxToShow) {
                ctx.fillStyle = '#333';
                ctx.font = 'bold 11px sans-serif';
                ctx.fillText(`+${count - maxToShow}`, startX + (maxPerRow * horizontalSpacing) + 2, floorY + 5);
            }
        });
    }

    trackRequest(floor, currentStep) {
        if (!this.requestSteps.has(floor)) {
            this.requestSteps.set(floor, []);
        }
        this.requestSteps.get(floor).push(currentStep);
    }

    trackServed(floor, currentStep) {
        if (this.requestSteps.has(floor)) {
            const steps = this.requestSteps.get(floor);
            if (steps.length > 0) {
                // Serve the oldest request (FIFO)
                const requestStep = steps.shift();
                const waitTime = currentStep - requestStep;
                this.waitTimes.push(waitTime);
                this.servedCount++;

                // Remove floor from map if no more requests
                if (steps.length === 0) {
                    this.requestSteps.delete(floor);
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
            this.trackServed(this.elevator.currentFloor, this.elevator.stepCount);
        }

        // Draw after step
        this.draw();

        // Check if elevator has requests (support different elevator types)
        let hasRequests = false;
        if (this.elevator.requestQueue !== undefined) {
            // SCAN, FCFS, or SSTF - all use requestQueue
            hasRequests = this.elevator.requestQueue.length > 0;
        }

        const hasTrackedRequests = this.requestSteps.size > 0;

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
        this.requestSteps.clear();
        this.elevator.reset();
        this.draw();
    }
}

const ScenarioGenerator = {
    baseline: (numFloors = 10) => {
        // BALANCED: Random requests across all floors
        const requests = [];
        for (let i = 0; i < 20; i++) {
            const floor = Math.floor(Math.random() * numFloors) + 1;
            const direction = Math.random() < 0.5 ? 'UP' : 'DOWN';
            requests.push({ floor, direction });
        }

        return {
            requests,
            description: '⚖️ Balanced Random Traffic',
            detail: '20 random requests. Baseline comparison ',
            pattern: 'random' // For continuous mode
        };
    },

    rushhour: (numFloors = 10) => {
        // BUILDING RUSH WITH STRAGGLERS: Dense cluster at bottom, continuous arrivals at top
        const requests = [];

        // Initial burst: Heavy traffic at floors 1-3 (10 requests)
        const bottomFloors = [1, 1, 2, 2, 2, 3, 3, 1, 2, 3];
        bottomFloors.forEach(floor => {
            requests.push({ floor, direction: 'UP' });
        });

        // Add a few mid-level requests
        requests.push({ floor: 5, direction: 'UP' });
        requests.push({ floor: 6, direction: 'DOWN' });

        return {
            requests,
            description: '🏢 Building Rush with Stragglers',
            detail: 'Dense cluster at floors 1-3, then continuous arrivals at 8-10. ',
            pattern: 'rushhour'
        };
    },

    floorhogging: () => {
        // FLOOR HOGGING: Multiple requests to same popular floors
        const requests = [];

        // Floor 1 (Lobby) - 5 requests
        for (let i = 0; i < 5; i++) {
            requests.push({ floor: 1, direction: 'UP' });
        }

        // Floor 5 (Popular Office) - 7 requests
        for (let i = 0; i < 7; i++) {
            requests.push({ floor: 5, direction: Math.random() < 0.5 ? 'UP' : 'DOWN' });
        }

        // Scattered requests on other floors - 3 requests
        requests.push({ floor: 3, direction: 'UP' });
        requests.push({ floor: 8, direction: 'DOWN' });
        requests.push({ floor: 10, direction: 'DOWN' });

        return {
            requests,
            description: '🏢 Floor Hogging',
            detail: 'Multiple requests to popular floors',
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
        visualizers.sstf.elevator.addRequest(req.floor);
        visualizers.sstf.trackRequest(req.floor, visualizers.sstf.elevator.stepCount);

        visualizers.scan.elevator.addRequest(req.floor);
        visualizers.scan.trackRequest(req.floor, visualizers.scan.elevator.stepCount);

        visualizers.fcfs.elevator.addRequest(req.floor);
        visualizers.fcfs.trackRequest(req.floor, visualizers.fcfs.elevator.stepCount);
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
        let floor, direction;

        // Generate requests based on current scenario pattern
        if (currentScenarioPattern === 'rushhour') {
            // Building rush with stragglers: 70% at top floors, 30% at bottom/middle
            if (Math.random() < 0.7) {
                // 70% chance: Add straggler at top floors (8-10)
                floor = Math.floor(Math.random() * 3) + 8;
                direction = 'DOWN';
            } else {
                // 30% chance: Add request at bottom/middle
                floor = Math.floor(Math.random() * 5) + 1;
                direction = 'UP';
            }
        } else if (currentScenarioPattern === 'floorhogging') {
            // Floor hogging: Popular floors get most traffic
            const rand = Math.random();
            if (rand < 0.6) {
                // 60% chance: Floor 5 (popular office)
                floor = 5;
                direction = Math.random() < 0.5 ? 'UP' : 'DOWN';
            } else if (rand < 0.9) {
                // 30% chance: Floor 1 (lobby)
                floor = 1;
                direction = 'UP';
            } else {
                // 10% chance: Random other floor
                floor = Math.floor(Math.random() * 10) + 1;
                direction = floor <= 5 ? 'UP' : 'DOWN';
            }
        } else {
            // Random/baseline: Truly random
            floor = Math.floor(Math.random() * 10) + 1;
            direction = Math.random() < 0.5 ? 'UP' : 'DOWN';
        }

        visualizers.sstf.elevator.addRequest(floor);
        visualizers.sstf.trackRequest(floor, visualizers.sstf.elevator.stepCount);

        visualizers.scan.elevator.addRequest(floor);
        visualizers.scan.trackRequest(floor, visualizers.scan.elevator.stepCount);

        visualizers.fcfs.elevator.addRequest(floor);
        visualizers.fcfs.trackRequest(floor, visualizers.fcfs.elevator.stepCount);
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

        // Get pending count based on elevator type
        let pending = 0;
        if (elevator.requestQueue !== undefined) {
            // SCAN, FCFS, or SSTF - all use requestQueue
            pending = elevator.requestQueue.length;
        }
        document.getElementById(`pending-${alg}`).textContent = pending;

        document.getElementById(`moves-${alg}`).textContent = metrics.totalMoves;
        document.getElementById(`avgwait-${alg}`).textContent = metrics.avgWait + ' steps';
        document.getElementById(`maxwait-${alg}`).textContent = metrics.maxWait + ' steps';
        document.getElementById(`served-${alg}`).textContent = metrics.served;
    });
}