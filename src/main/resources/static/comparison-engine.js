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

        this.requestTimestamps = new Map();
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
        if (this.elevator.direction === 'UP' || this.elevator.direction === 1) {
            arrow = '↑';
        } else if (this.elevator.direction === 'DOWN' || this.elevator.direction === -1) {
            arrow = '↓';
        }
        ctx.textAlign = 'center';
        ctx.fillText(arrow, shaftX + shaftWidth / 2, elevatorY + floorHeight / 2 + 2);
        ctx.textAlign = 'left';

        const requests = this.elevator.requests instanceof Set
            ? Array.from(this.elevator.requests)
            : this.elevator.requestQueue || [];

        requests.forEach(floor => {
            const y = height - 20 - ((floor - 1) * floorHeight) - floorHeight / 2;
            ctx.fillStyle = '#FF5722';
            ctx.beginPath();
            ctx.arc(shaftX + shaftWidth + 25, y, 5, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    trackRequest(floor) {
        if (!this.requestTimestamps.has(floor)) {
            this.requestTimestamps.set(floor, Date.now());
        }
    }

    trackServed(floor) {
        if (this.requestTimestamps.has(floor)) {
            const waitTime = (Date.now() - this.requestTimestamps.get(floor)) / 1000;
            this.waitTimes.push(waitTime);
            this.requestTimestamps.delete(floor);
            this.servedCount++;
        }
    }

    getMetrics() {
        const avgWait = this.waitTimes.length > 0
            ? (this.waitTimes.reduce((a, b) => a + b, 0) / this.waitTimes.length).toFixed(1)
            : 0;

        const maxWait = this.waitTimes.length > 0
            ? Math.max(...this.waitTimes).toFixed(1)
            : 0;

        return {
            avgWait,
            maxWait,
            served: this.servedCount,
            totalMoves: this.elevator.totalMoves || this.elevator.visitedFloors?.length || 0
        };
    }

    start() {
        this.isRunning = true;
        this.animate();
    }

    animate() {
        if (!this.isRunning) return;

        this.draw();

        const currentFloor = this.elevator.currentFloor;
        if (this.elevator.requests instanceof Set) {
            if (this.elevator.requests.has(currentFloor)) {
                this.trackServed(currentFloor);
            }
        }

        const result = this.elevator.step();

        if (result.served) {
            this.trackServed(result.floor || result.currentFloor);
        }

        const hasRequests = this.elevator.requests instanceof Set
            ? this.elevator.requests.size > 0
            : this.elevator.requestQueue?.length > 0;

        if (hasRequests || window.continuousMode) {
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
        this.requestTimestamps.clear();
        this.elevator.reset();
        this.draw();
    }
}

const ScenarioGenerator = {
    baseline: (numFloors = 10) => {
        const requests = [];
        for (let i = 0; i < 15; i++) {
            const floor = Math.floor(Math.random() * numFloors) + 1;
            const direction = Math.random() < 0.5 ? 'UP' : 'DOWN';
            requests.push({ floor, direction });
        }
        return {
            requests,
            description: 'Baseline: Balanced traffic across all floors',
            detail: '15 random requests distributed evenly. Tests basic algorithm performance.'
        };
    },

    rushhour: (numFloors = 10) => {
        const requests = [];
        for (let i = 0; i < 25; i++) {
            if (Math.random() < 0.8) {
                const targetFloor = Math.floor(Math.random() * (numFloors - 1)) + 2;
                requests.push({ floor: targetFloor, direction: 'UP', fromFloor: 1 });
            } else {
                const floor = Math.floor(Math.random() * numFloors) + 1;
                const direction = Math.random() < 0.5 ? 'UP' : 'DOWN';
                requests.push({ floor, direction });
            }
        }
        return {
            requests,
            description: 'Rush Hour: Morning commute pattern',
            detail: '25 requests - 80% upward from floor 1. Tests directional batching efficiency.'
        };
    },

    floorhogging: (numFloors = 10) => {
        const requests = [];
        for (let i = 0; i < 30; i++) {
            if (Math.random() < 0.7) {
                const floor = Math.floor(Math.random() * 3) + 1;
                requests.push({ floor, direction: Math.random() < 0.5 ? 'UP' : 'DOWN' });
            } else {
                const floor = Math.floor(Math.random() * 5) + 6;
                requests.push({ floor, direction: 'DOWN' });
            }
        }
        return {
            requests,
            description: 'Floor Hogging: Short trips monopolize elevator',
            detail: '30 requests - 70% between floors 1-3, 30% to high floors. Tests starvation prevention.'
        };
    },

    random: (numFloors = 10) => {
        const requests = [];
        const numRequests = 15 + Math.floor(Math.random() * 15);
        for (let i = 0; i < numRequests; i++) {
            const floor = Math.floor(Math.random() * numFloors) + 1;
            const direction = Math.random() < 0.5 ? 'UP' : 'DOWN';
            requests.push({ floor, direction });
        }
        return {
            requests,
            description: 'Random Traffic: Unpredictable patterns',
            detail: `${numRequests} completely random requests. Tests algorithm adaptability.`
        };
    },

    extreme: (numFloors = 10) => {
        const requests = [];
        for (let i = 0; i < 40; i++) {
            const floor = Math.floor(Math.random() * numFloors) + 1;
            const direction = Math.random() < 0.5 ? 'UP' : 'DOWN';
            requests.push({ floor, direction });
        }
        return {
            requests,
            description: 'Extreme Load: Stress test',
            detail: '40 simultaneous requests. Tests algorithm performance under heavy load.'
        };
    },

    continuous: (numFloors = 10) => {
        const requests = [];
        for (let i = 0; i < 10; i++) {
            const floor = Math.floor(Math.random() * numFloors) + 1;
            const direction = Math.random() < 0.5 ? 'UP' : 'DOWN';
            requests.push({ floor, direction });
        }
        return {
            requests,
            description: 'Continuous Mode: Ongoing simulation',
            detail: 'New requests are added periodically. Run indefinitely until stopped.'
        };
    }
};

let visualizers = {};
let updateInterval = null;
window.continuousMode = false;
let continuousInterval = null;

document.addEventListener('DOMContentLoaded', () => {
    const numFloors = 10;

    visualizers.rushhour = new ElevatorVisualizer(
        'canvas-rushhour',
        new RushHourElevator(numFloors),
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
    stopAll();

    const scenario = ScenarioGenerator[scenarioName](10);

    document.getElementById('scenarioDescription').innerHTML = `
        <h4>${scenario.description}</h4>
        <p>${scenario.detail}</p>
    `;

    Object.values(visualizers).forEach(v => v.reset());

    scenario.requests.forEach(req => {
        visualizers.rushhour.elevator.addRequest(req.floor, req.direction);
        visualizers.rushhour.trackRequest(req.floor);

        visualizers.scan.elevator.addRequest(req.floor);
        visualizers.scan.trackRequest(req.floor);

        visualizers.fcfs.elevator.addRequest(req.floor);
        visualizers.fcfs.trackRequest(req.floor);
    });

    Object.values(visualizers).forEach(v => v.start());

    if (scenarioName === 'continuous') {
        window.continuousMode = true;
        continuousInterval = setInterval(() => {
            addRandomRequest();
        }, 3000);
    }

    updateInterval = setInterval(updateMetrics, 100);
}

function addRandomRequest() {
    const floor = Math.floor(Math.random() * 10) + 1;
    const direction = Math.random() < 0.5 ? 'UP' : 'DOWN';

    visualizers.rushhour.elevator.addRequest(floor, direction);
    visualizers.rushhour.trackRequest(floor);

    visualizers.scan.elevator.addRequest(floor);
    visualizers.scan.trackRequest(floor);

    visualizers.fcfs.elevator.addRequest(floor);
    visualizers.fcfs.trackRequest(floor);
}

function stopAll() {
    window.continuousMode = false;

    if (continuousInterval) {
        clearInterval(continuousInterval);
        continuousInterval = null;
    }

    if (updateInterval) {
        clearInterval(updateInterval);
        updateInterval = null;
    }

    Object.values(visualizers).forEach(v => v.stop());
}

function updateMetrics() {
    ['rushhour', 'scan', 'fcfs'].forEach(alg => {
        const viz = visualizers[alg];
        const elevator = viz.elevator;
        const metrics = viz.getMetrics();

        document.getElementById(`floor-${alg}`).textContent = elevator.currentFloor;

        let direction = 'IDLE';
        if (elevator.direction === 'UP' || elevator.direction === 1) direction = 'UP';
        else if (elevator.direction === 'DOWN' || elevator.direction === -1) direction = 'DOWN';
        document.getElementById(`direction-${alg}`).textContent = direction;

        const pending = elevator.requests instanceof Set
            ? elevator.requests.size
            : elevator.requestQueue?.length || 0;
        document.getElementById(`pending-${alg}`).textContent = pending;

        document.getElementById(`moves-${alg}`).textContent = metrics.totalMoves;
        document.getElementById(`avgwait-${alg}`).textContent = metrics.avgWait + 's';
        document.getElementById(`maxwait-${alg}`).textContent = metrics.maxWait + 's';
        document.getElementById(`served-${alg}`).textContent = metrics.served;

        const efficiency = metrics.served > 0
            ? (metrics.totalMoves / metrics.served).toFixed(2)
            : '-';
        document.getElementById(`summary-${alg}`).textContent =
            efficiency !== '-' ? `${efficiency} moves/request` : 'No data';
    });
}