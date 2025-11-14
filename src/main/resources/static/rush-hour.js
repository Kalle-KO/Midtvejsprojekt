
//  RUSH HOUR OPTIMIZATION
// alle skal op

class RushHourElevator {
    constructor(numFloors = 10) {
        this.numFloors = numFloors;
        this.currentFloor = 1;
        this.direction = 'UP';
        this.requests = new Set();
        this.upRequests = new Set();
        this.downRequests = new Set();
        this.moveHistory = [];
        this.totalMoves = 0;
    }

    addRequest(floor, direction = null) {
        if (floor < 1 || floor > this.numFloors) return;

        this.requests.add(floor);

        if (direction === 'UP') {
            this.upRequests.add(floor);
        } else if (direction === 'DOWN') {
            this.downRequests.add(floor);
        } else {
            // ingen preference
            this.upRequests.add(floor);
            this.downRequests.add(floor);
        }
    }


     // up first

    getNextFloor() {
        if (this.requests.size === 0) return null;

        const relevantRequests = this.direction === 'UP' ? this.upRequests : this.downRequests;

        const floorsInDirection = Array.from(relevantRequests).filter(floor => {
            return this.direction === 'UP' ? floor > this.currentFloor : floor < this.currentFloor;
        });

        if (floorsInDirection.length > 0) {
            return this.direction === 'UP'
                ? Math.min(...floorsInDirection)
                : Math.max(...floorsInDirection);
        }

        const oppositeRequests = this.direction === 'UP' ? this.downRequests : this.upRequests;
        const floorsInOpposite = Array.from(oppositeRequests);

        if (floorsInOpposite.length > 0) {
            this.direction = this.direction === 'UP' ? 'DOWN' : 'UP';

            return this.direction === 'UP'
                ? Math.min(...floorsInOpposite)
                : Math.max(...floorsInOpposite);
        }

        return Array.from(this.requests)[0];
    }


      // next floor

    step() {
        const nextFloor = this.getNextFloor();

        if (nextFloor === null) {
            return { done: true, currentFloor: this.currentFloor, direction: this.direction };
        }

        if (nextFloor > this.currentFloor) {
            this.currentFloor++;
        } else if (nextFloor < this.currentFloor) {
            this.currentFloor--;
        }

        this.totalMoves++;

        let served = false;
        if (this.requests.has(this.currentFloor)) {
            this.requests.delete(this.currentFloor);
            this.upRequests.delete(this.currentFloor);
            this.downRequests.delete(this.currentFloor);
            served = true;
        }

        this.moveHistory.push({
            floor: this.currentFloor,
            direction: this.direction,
            served: served,
            remaining: this.requests.size
        });

        return {
            done: false,
            currentFloor: this.currentFloor,
            direction: this.direction,
            served: served,
            remaining: this.requests.size
        };
    }


    runSimulation() {
        const steps = [];
        let maxSteps = 1000; // Safety limit

        while (this.requests.size > 0 && maxSteps-- > 0) {
            steps.push(this.step());
        }

        return {
            steps: steps,
            totalMoves: this.totalMoves,
            efficiency: this.totalMoves / Math.max(1, steps.filter(s => s.served).length)
        };
    }


    reset() {
        this.currentFloor = 1;
        this.direction = 'UP';
        this.requests.clear();
        this.upRequests.clear();
        this.downRequests.clear();
        this.moveHistory = [];
        this.totalMoves = 0;
    }
}

// rush hour scenarie. 80% up requests
function generateRushHourRequests(numRequests = 20, numFloors = 10) {
    const requests = [];

    for (let i = 0; i < numRequests; i++) {
        if (Math.random() < 0.8) {
            // 80% are upward from floor 1
            const targetFloor = Math.floor(Math.random() * (numFloors - 1)) + 2; // Floors 2-10
            requests.push({ floor: targetFloor, direction: 'UP', fromFloor: 1 });
        } else {
            // 20% are random
            const floor = Math.floor(Math.random() * numFloors) + 1;
            const direction = Math.random() < 0.5 ? 'UP' : 'DOWN';
            requests.push({ floor: floor, direction: direction });
        }
    }

    return requests;
}


class RushHourVisualizer {
    constructor(canvasId, numFloors = 10) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.numFloors = numFloors;
        this.elevator = new RushHourElevator(numFloors);
        this.animationId = null;
        this.animationSpeed = 500; // ms per step
    }

    draw() {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Draw building
        const floorHeight = (height - 40) / this.numFloors;
        const shaftX = width / 2 - 30;
        const shaftWidth = 60;

        // Draw floors
        ctx.strokeStyle = '#ddd';
        ctx.lineWidth = 1;
        for (let i = 0; i <= this.numFloors; i++) {
            const y = height - 20 - (i * floorHeight);
            ctx.beginPath();
            ctx.moveTo(shaftX - 20, y);
            ctx.lineTo(shaftX + shaftWidth + 20, y);
            ctx.stroke();

            // Floor numbers
            ctx.fillStyle = '#666';
            ctx.font = '12px monospace';
            ctx.fillText(String(i + 1), shaftX - 40, y + 5);
        }

        // Draw elevator shaft
        ctx.strokeStyle = '#999';
        ctx.lineWidth = 2;
        ctx.strokeRect(shaftX, 20, shaftWidth, height - 40);

        // Draw elevator car
        const elevatorY = height - 20 - ((this.elevator.currentFloor - 1) * floorHeight) - floorHeight + 10;
        ctx.fillStyle = this.elevator.direction === 'UP' ? '#4CAF50' : '#2196F3';
        ctx.fillRect(shaftX + 5, elevatorY, shaftWidth - 10, floorHeight - 20);

        // Draw direction arrow
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 20px sans-serif';
        const arrow = this.elevator.direction === 'UP' ? '↑' : '↓';
        ctx.fillText(arrow, shaftX + shaftWidth / 2 - 8, elevatorY + floorHeight / 2);

        // Draw pending requests
        Array.from(this.elevator.requests).forEach(floor => {
            const y = height - 20 - ((floor - 1) * floorHeight) - floorHeight / 2;
            ctx.fillStyle = '#FF5722';
            ctx.beginPath();
            ctx.arc(shaftX + shaftWidth + 35, y, 6, 0, Math.PI * 2);
            ctx.fill();
        });

        // Draw stats
        ctx.fillStyle = '#333';
        ctx.font = '14px system-ui';
        ctx.fillText(`Floor: ${this.elevator.currentFloor}`, 10, 20);
        ctx.fillText(`Direction: ${this.elevator.direction}`, 10, 40);
        ctx.fillText(`Pending: ${this.elevator.requests.size}`, 10, 60);
        ctx.fillText(`Moves: ${this.elevator.totalMoves}`, 10, 80);
    }

    start(requests) {
        this.elevator.reset();

        // Add all requests
        requests.forEach(req => {
            this.elevator.addRequest(req.floor, req.direction);
        });

        // Start animation
        this.animate();
    }

    animate() {
        this.draw();

        if (this.elevator.requests.size > 0) {
            this.animationId = setTimeout(() => {
                this.elevator.step();
                this.animate();
            }, this.animationSpeed);
        }
    }

    stop() {
        if (this.animationId) {
            clearTimeout(this.animationId);
            this.animationId = null;
        }
    }
}

// Export for use in browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { RushHourElevator, generateRushHourRequests, RushHourVisualizer };
}