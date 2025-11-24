class SstfElevator {
    constructor(numFloors = 10) {
        this.numFloors = numFloors;
        this.currentFloor = 1;
        this.direction = 'IDLE';
        this.requestQueue = [];
        this.totalMoves = 0;
        this.stepCount = 0;
    }

    addRequest(floor) {
        if (floor >= 1 && floor <= this.numFloors) {
            this.requestQueue.push(floor);
        }
    }

    findClosestFloor() {
        if (this.requestQueue.length === 0) return null;

        let closestFloor = this.requestQueue[0];
        let minDistance = Math.abs(this.currentFloor - closestFloor);

        for (let i = 1; i < this.requestQueue.length; i++) {
            const floor = this.requestQueue[i];
            const distance = Math.abs(this.currentFloor - floor);
            if (distance < minDistance) {
                minDistance = distance;
                closestFloor = floor;
            }
        }

        return closestFloor;
    }

    step() {
        this.stepCount++;

        // No requests - idle
        if (this.requestQueue.length === 0) {
            this.direction = 'IDLE';
            return {
                floor: this.currentFloor,
                action: 'idle',
                direction: 'idle',
                remainingRequests: [],
                served: false
            };
        }

        // Check if current floor has a request - serve it
        const currentFloorIndex = this.requestQueue.indexOf(this.currentFloor);
        if (currentFloorIndex !== -1) {
            // Serve one guest
            this.requestQueue.splice(currentFloorIndex, 1);

            // After serving, return - don't move in same step
            return {
                floor: this.currentFloor,
                action: 'serviced',
                direction: this.requestQueue.length === 0 ? 'idle' : this.direction,
                remainingRequests: [...this.requestQueue],
                served: true
            };
        }

        // Find closest requested floor
        const closestFloor = this.findClosestFloor();

        if (closestFloor === null) {
            this.direction = 'IDLE';
            return {
                floor: this.currentFloor,
                action: 'idle',
                direction: 'idle',
                remainingRequests: [],
                served: false
            };
        }

        // Move one step toward closest floor
        if (closestFloor > this.currentFloor) {
            this.currentFloor++;
            this.direction = 'UP';
        } else if (closestFloor < this.currentFloor) {
            this.currentFloor--;
            this.direction = 'DOWN';
        } else {
            // Should not happen (we already checked current floor)
            this.direction = 'IDLE';
        }

        this.totalMoves++;

        return {
            floor: this.currentFloor,
            action: 'moving',
            direction: this.direction.toLowerCase(),
            remainingRequests: [...this.requestQueue],
            served: false
        };
    }

    reset() {
        this.currentFloor = 1;
        this.direction = 'IDLE';
        this.requestQueue = [];
        this.totalMoves = 0;
        this.stepCount = 0;
    }

    get requests() {
        return new Set(this.requestQueue);
    }
}
