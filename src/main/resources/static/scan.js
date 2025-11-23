class ScanElevator {
    constructor(numFloors = 10) {
        this.numFloors = numFloors;
        this.currentFloor = 1;
        this.direction = 1;
        this.requests = new Set();
        this.totalMoves = 0;
        this.stepCount = 0;
    }

    addRequest(floor) {
        if (floor >= 1 && floor <= this.numFloors) {
            this.requests.add(floor);
        }
    }

    hasRequestsInCurrentDirection() {
        for (let floor of this.requests) {
            if (this.direction === 1 && floor > this.currentFloor) {
                return true;
            }
            if (this.direction === -1 && floor < this.currentFloor) {
                return true;
            }
        }
        return false;
    }

    hasRequestsInOppositeDirection() {
        for (let floor of this.requests) {
            if (this.direction === 1 && floor < this.currentFloor) {
                return true;
            }
            if (this.direction === -1 && floor > this.currentFloor) {
                return true;
            }
        }
        return false;
    }

    step() {
        this.stepCount++;

        if (this.requests.size === 0) {
            this.direction = 0; // IDLE
            return {
                floor: this.currentFloor,
                action: 'idle',
                direction: 'idle',
                remainingRequests: [],
                served: false
            };
        }

        // Determine direction before moving
        if (!this.hasRequestsInCurrentDirection()) {
            if (this.hasRequestsInOppositeDirection()) {
                this.direction *= -1;
            } else if (this.requests.size > 0) {
                // If we have requests but none in current or opposite direction,
                // pick the nearest request
                const anyFloor = Array.from(this.requests)[0];
                this.direction = anyFloor > this.currentFloor ? 1 : anyFloor < this.currentFloor ? -1 : 0;
            }
        }

        // Move first (if not already at a request)
        if (!this.requests.has(this.currentFloor)) {
            this.currentFloor += this.direction;
            this.totalMoves++;

            if (this.currentFloor < 1) {
                this.currentFloor = 1;
                this.direction = 1;
            } else if (this.currentFloor > this.numFloors) {
                this.currentFloor = this.numFloors;
                this.direction = -1;
            }
        }

        // Then check if we should serve current floor
        let served = false;
        if (this.requests.has(this.currentFloor)) {
            this.requests.delete(this.currentFloor);
            served = true;

            if (this.requests.size === 0) {
                this.direction = 0; // IDLE
            }
        }

        return {
            floor: this.currentFloor,
            action: served ? 'serviced' : 'moving',
            direction: this.direction === 0 ? 'idle' : (this.direction === 1 ? 'up' : 'down'),
            remainingRequests: Array.from(this.requests),
            served: served
        };
    }

    reset() {
        this.currentFloor = 1;
        this.direction = 1;
        this.requests.clear();
        this.totalMoves = 0;
        this.stepCount = 0;
    }
}