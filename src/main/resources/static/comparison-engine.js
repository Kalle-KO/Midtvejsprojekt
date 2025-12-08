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

        this.requestSteps = new Map();
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

        // Draw floor lines and numbers
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

        // Draw elevator shaft
        ctx.strokeStyle = '#999';
        ctx.lineWidth = 2;
        ctx.strokeRect(shaftX, 20, shaftWidth, height - 40);

        let currentFloor = this.elevator.currentFloor;

        // Draw elevator box
        const elevatorY = height - 20 - ((currentFloor - 1) * floorHeight) - floorHeight + 8;
        ctx.fillStyle = this.color;
        ctx.fillRect(shaftX + 4, elevatorY, shaftWidth - 8, floorHeight - 16);

        // Draw direction arrow
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px sans-serif';
        let arrow = '◆';
        if (this.elevator.direction === 'UP') {
            arrow = '↑';
        } else if (this.elevator.direction === 'DOWN') {
            arrow = '↓';
        }
        ctx.textAlign = 'center';
        ctx.fillText(arrow, shaftX + shaftWidth / 2, elevatorY + floorHeight / 2 + 2);
        ctx.textAlign = 'left';

        // Draw passengers INSIDE elevator (onboard)
        if (this.elevator.onboardQueue && this.elevator.onboardQueue.length > 0) {
            const onboardCount = this.elevator.onboardQueue.length;
            const guestRadius = 4;
            const spacing = 8;
            const startX = shaftX + 8;
            const startY = elevatorY + floorHeight - 20;
            const maxPerRow = 4;

            for (let i = 0; i < Math.min(onboardCount, 12); i++) {
                const row = Math.floor(i / maxPerRow);
                const col = i % maxPerRow;
                const xPos = startX + (col * spacing);
                const yPos = startY + (row * spacing);

                // Draw onboard guest (blue)
                ctx.fillStyle = '#2196F3';
                ctx.beginPath();
                ctx.arc(xPos, yPos, guestRadius, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#1976D2';
                ctx.lineWidth = 1;
                ctx.stroke();
            }

            if (onboardCount > 12) {
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 9px sans-serif';
                ctx.fillText(`+${onboardCount - 12}`, startX + (maxPerRow * spacing) + 2, startY + 5);
            }
        }

        // Draw waiting passengers on floors (pickup queue)
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

                // Draw waiting guest (orange)
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
                const requestStep = steps.shift();
                const waitTime = currentStep - requestStep;
                this.waitTimes.push(waitTime);
                this.servedCount++;

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

        if (result.served) {
            this.trackServed(this.elevator.currentFloor, this.elevator.stepCount);
        }

        this.draw();

        let hasRequests = false;
        if (this.elevator.pickupQueue !== undefined) {
            hasRequests = this.elevator.pickupQueue.length > 0 ||
                this.elevator.onboardQueue.length > 0;
        } else if (this.elevator.requestQueue !== undefined) {
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
        const requests = [];
        for (let i = 0; i < 20; i++) {
            const pickup = Math.floor(Math.random() * numFloors) + 1;
            let destination = Math.floor(Math.random() * numFloors) + 1;
            while (destination === pickup) {
                destination = Math.floor(Math.random() * numFloors) + 1;
            }
            requests.push({ pickup, destination });
        }

        return {
            requests,
            description: '⚖️ Balanced Random Traffic',
            detail: '20 random requests. Baseline comparison',
            pattern: 'random'
        };
    },

    rushhour: (numFloors = 10) => {
        const requests = [];

        for (let i = 0; i < 10; i++) {
            const pickup = Math.floor(Math.random() * 3) + 1;
            const destination = Math.floor(Math.random() * 4) + 7;
            requests.push({ pickup, destination });
        }

        requests.push({ pickup: 5, destination: 9 });
        requests.push({ pickup: 6, destination: 2 });

        return {
            requests,
            description: '🏢 Building Rush',
            detail: 'Dense cluster at floors 1-3 going up. Tests morning commute pattern.',
            pattern: 'rushhour'
        };
    },

    floorhogging: () => {
        const requests = [];

        for (let i = 0; i < 5; i++) {
            const destination = Math.floor(Math.random() * 5) + 5;
            requests.push({ pickup: 1, destination });
        }

        for (let i = 0; i < 7; i++) {
            const isGoingUp = Math.random() < 0.5;
            const destination = isGoingUp
                ? Math.floor(Math.random() * 3) + 8
                : Math.floor(Math.random() * 3) + 1;
            requests.push({ pickup: 5, destination });
        }

        requests.push({ pickup: 3, destination: 7 });
        requests.push({ pickup: 8, destination: 2 });
        requests.push({ pickup: 10, destination: 4 });

        return {
            requests,
            description: '🏢 Floor Hogging',
            detail: 'Multiple requests to popular floors: 5x floor 1 (lobby), 7x floor 5 (office), 3x others.',
            pattern: 'floorhogging'
        };
    }
};

let visualizers = {};
let updateInterval = null;
let continuousMode = false;
let continuousInterval = null;
let currentScenarioPattern = 'random';

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
    currentScenarioPattern = scenario.pattern || 'random';

    document.getElementById('scenarioDescription').innerHTML = `
        <h4>${scenario.description}</h4>
        <p>${scenario.detail}</p>
    `;

    Object.values(visualizers).forEach(v => v.reset());

    scenario.requests.forEach(req => {
        visualizers.sstf.elevator.addRequest(req.pickup, req.destination);
        visualizers.sstf.trackRequest(req.pickup, visualizers.sstf.elevator.stepCount);

        visualizers.scan.elevator.addRequest(req.pickup, req.destination);
        visualizers.scan.trackRequest(req.pickup, visualizers.scan.elevator.stepCount);

        visualizers.fcfs.elevator.addRequest(req.pickup, req.destination);
        visualizers.fcfs.trackRequest(req.pickup, visualizers.fcfs.elevator.stepCount);
    });

    Object.values(visualizers).forEach(v => v.start());

    if (continuousMode) {
        startContinuous();
    }

    updateInterval = setInterval(updateMetrics, 100);
}

function addRandomRequests() {
    const numRequests = Math.floor(Math.random() * 2) + 2;

    for (let i = 0; i < numRequests; i++) {
        let pickup, destination;

        if (currentScenarioPattern === 'rushhour') {
            if (Math.random() < 0.7) {
                pickup = Math.floor(Math.random() * 3) + 8;
                destination = Math.floor(Math.random() * 5) + 1;
            } else {
                pickup = Math.floor(Math.random() * 3) + 1;
                destination = Math.floor(Math.random() * 4) + 7;
            }
        } else if (currentScenarioPattern === 'floorhogging') {
            const rand = Math.random();
            if (rand < 0.6) {
                pickup = 5;
                destination = Math.random() < 0.5
                    ? Math.floor(Math.random() * 3) + 8
                    : Math.floor(Math.random() * 3) + 1;
            } else if (rand < 0.9) {
                pickup = 1;
                destination = Math.floor(Math.random() * 5) + 5;
            } else {
                pickup = Math.floor(Math.random() * 10) + 1;
                destination = Math.floor(Math.random() * 10) + 1;
                while (destination === pickup) {
                    destination = Math.floor(Math.random() * 10) + 1;
                }
            }
        } else {
            pickup = Math.floor(Math.random() * 10) + 1;
            destination = Math.floor(Math.random() * 10) + 1;
            while (destination === pickup) {
                destination = Math.floor(Math.random() * 10) + 1;
            }
        }

        visualizers.sstf.elevator.addRequest(pickup, destination);
        visualizers.sstf.trackRequest(pickup, visualizers.sstf.elevator.stepCount);

        visualizers.scan.elevator.addRequest(pickup, destination);
        visualizers.scan.trackRequest(pickup, visualizers.scan.elevator.stepCount);

        visualizers.fcfs.elevator.addRequest(pickup, destination);
        visualizers.fcfs.trackRequest(pickup, visualizers.fcfs.elevator.stepCount);
    }
}

function startContinuous() {
    if (!continuousInterval) {
        continuousInterval = setInterval(() => {
            addRandomRequests();
        }, 2000);
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

        let pending = 0;
        if (elevator.pickupQueue !== undefined) {
            pending = elevator.pickupQueue.length + elevator.onboardQueue.length;
        } else if (elevator.requestQueue !== undefined) {
            pending = elevator.requestQueue.length;
        }
        document.getElementById(`pending-${alg}`).textContent = pending;

        document.getElementById(`moves-${alg}`).textContent = metrics.totalMoves;
        document.getElementById(`avgwait-${alg}`).textContent = metrics.avgWait + ' steps';
        document.getElementById(`maxwait-${alg}`).textContent = metrics.maxWait + ' steps';
        document.getElementById(`served-${alg}`).textContent = metrics.served;
    });
}