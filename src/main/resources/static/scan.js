class ScanElevator {
    constructor(numFloors = 10) {
        this.numFloors = numFloors;
        this.currentFloor = 1;
        this.direction = 1;
        this.requests = new Set();
        this.totalMoves = 0;
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
        if (this.requests.has(this.currentFloor)) {
            this.requests.delete(this.currentFloor);
            return {
                floor: this.currentFloor,
                action: 'serviced',
                direction: this.direction === 1 ? 'up' : 'down',
                remainingRequests: Array.from(this.requests),
                served: true
            };
        }

        if (this.requests.size === 0) {
            return {
                floor: this.currentFloor,
                action: 'idle',
                direction: this.direction === 1 ? 'up' : 'down',
                remainingRequests: [],
                served: false
            };
        }

        if (!this.hasRequestsInCurrentDirection()) {
            if (this.hasRequestsInOppositeDirection()) {
                this.direction *= -1;
                return {
                    floor: this.currentFloor,
                    action: 'reversed',
                    direction: this.direction === 1 ? 'up' : 'down',
                    remainingRequests: Array.from(this.requests),
                    served: false
                };
            }
        }

        this.currentFloor += this.direction;
        this.totalMoves++;

        if (this.currentFloor < 1) {
            this.currentFloor = 1;
            this.direction = 1;
        } else if (this.currentFloor > this.numFloors) {
            this.currentFloor = this.numFloors;
            this.direction = -1;
        }

        return {
            floor: this.currentFloor,
            action: 'moving',
            direction: this.direction === 1 ? 'up' : 'down',
            remainingRequests: Array.from(this.requests),
            served: false
        };
    }

    reset() {
        this.currentFloor = 1;
        this.direction = 1;
        this.requests.clear();
        this.totalMoves = 0;
    }
}