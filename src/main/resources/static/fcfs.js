class FcfsElevator {
    constructor(numFloors = 10) {
        this.numFloors = numFloors;
        this.currentFloor = 1;
        this.requestQueue = [];
        this.visitedFloors = [];
        this.totalMoves = 0;
        this.direction = 'IDLE';
    }

    addRequest(floor) {
        if (floor >= 1 && floor <= this.numFloors) {
            this.requestQueue.push(floor);
        }
    }

    getCurrentDirection() {
        if (this.requestQueue.length === 0) {
            return 0;
        }
        const nextFloor = this.requestQueue[0];
        if (nextFloor > this.currentFloor) {
            return 1;
        } else if (nextFloor < this.currentFloor) {
            return -1;
        }
        return 0;
    }

    step() {
        const dir = this.getCurrentDirection();
        if (dir === 1) this.direction = 'UP';
        else if (dir === -1) this.direction = 'DOWN';
        else this.direction = 'IDLE';

        if (this.requestQueue.length === 0) {
            return {
                floor: this.currentFloor,
                action: 'idle',
                direction: 'idle',
                remainingRequests: [],
                served: false
            };
        }

        const targetFloor = this.requestQueue[0];

        if (this.currentFloor === targetFloor) {
            this.requestQueue.shift();
            this.visitedFloors.push(this.currentFloor);

            const nextDir = this.getCurrentDirection();
            if (nextDir === 1) this.direction = 'UP';
            else if (nextDir === -1) this.direction = 'DOWN';
            else this.direction = 'IDLE';

            return {
                floor: this.currentFloor,
                action: 'serviced',
                direction: this.direction.toLowerCase(),
                remainingRequests: [...this.requestQueue],
                served: true
            };
        }

        const direction = targetFloor > this.currentFloor ? 1 : -1;
        this.currentFloor += direction;
        this.totalMoves++;
        this.direction = direction === 1 ? 'UP' : 'DOWN';

        return {
            floor: this.currentFloor,
            action: 'moving',
            direction: direction === 1 ? 'up' : 'down',
            targetFloor: targetFloor,
            remainingRequests: [...this.requestQueue],
            served: false
        };
    }

    runComplete() {
        const states = [];
        while (this.requestQueue.length > 0) {
            const state = this.step();
            states.push(state);

            if (states.length > 1000) {
                console.error("Exceeded maximum iterations");
                break;
            }
        }
        return states;
    }

    calculateTotalDistance() {
        let distance = 0;
        let currentPos = 1;

        for (let floor of this.visitedFloors) {
            distance += Math.abs(floor - currentPos);
            currentPos = floor;
        }

        return distance;
    }

    getStats() {
        return {
            visitedFloors: this.visitedFloors,
            totalStops: this.visitedFloors.length,
            totalDistance: this.calculateTotalDistance(),
            totalMoves: this.totalMoves,
            pendingRequests: [...this.requestQueue]
        };
    }

    reset() {
        this.currentFloor = 1;
        this.requestQueue = [];
        this.visitedFloors = [];
        this.totalMoves = 0;
        this.direction = 'IDLE';
    }

    get requests() {
        return new Set(this.requestQueue);
    }
}