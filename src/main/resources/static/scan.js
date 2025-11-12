/**
 * SCAN Elevator Algorithm
 * The elevator continues in one direction until there are no more requests,
 * then reverses direction.
 */

class ScanElevator {
    constructor(numFloors = 10) {
        this.numFloors = numFloors; // Number of floors
        this.currentFloor = 0;
        this.direction = 1; // 1 for up, -1 for down
        this.requests = new Set(); // Floors that have been requested
        this.visitedFloors = []; // Track the order of visited floors
    }

    /**
     * Add a floor request
     * @param {number} floor - The floor number to visit
     */
    addRequest(floor) {
        if (floor >= 0 && floor < this.numFloors) {
            this.requests.add(floor);
        }
    }

    /**
     * Check if there are any requests in the current direction
     * @returns {boolean}
     */
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

    /**
     * Check if there are any requests in the opposite direction
     * @returns {boolean}
     */
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

    /**
     * Move to the next floor according to SCAN algorithm
     * @returns {object} - Current state with floor and action
     */
    step() {
        // Service current floor if it has a request
        if (this.requests.has(this.currentFloor)) {
            this.requests.delete(this.currentFloor);
            this.visitedFloors.push(this.currentFloor);
            return {
                floor: this.currentFloor,
                action: 'serviced',
                direction: this.direction === 1 ? 'up' : 'down',
                remainingRequests: Array.from(this.requests)
            };
        }

        // If no more requests, stay idle
        if (this.requests.size === 0) {
            return {
                floor: this.currentFloor,
                action: 'idle',
                direction: this.direction === 1 ? 'up' : 'down',
                remainingRequests: []
            };
        }

        // If no requests in current direction, reverse
        if (!this.hasRequestsInCurrentDirection()) {
            if (this.hasRequestsInOppositeDirection()) {
                this.direction *= -1; // Reverse direction
                return {
                    floor: this.currentFloor,
                    action: 'reversed',
                    direction: this.direction === 1 ? 'up' : 'down',
                    remainingRequests: Array.from(this.requests)
                };
            }
        }

        // Move in current direction
        this.currentFloor += this.direction;

        // Ensure we don't go out of bounds
        if (this.currentFloor < 0) {
            this.currentFloor = 0;
            this.direction = 1;
        } else if (this.currentFloor >= this.numFloors) {
            this.currentFloor = this.numFloors - 1;
            this.direction = -1;
        }

        return {
            floor: this.currentFloor,
            action: 'moving',
            direction: this.direction === 1 ? 'up' : 'down',
            remainingRequests: Array.from(this.requests)
        };
    }

    /**
     * Run the complete algorithm until all requests are serviced
     * @returns {array} - Array of all states
     */
    runComplete() {
        const states = [];
        while (this.requests.size > 0) {
            const state = this.step();
            states.push(state);

            // Prevent infinite loop
            if (states.length > 1000) {
                console.error("Exceeded maximum iterations");
                break;
            }
        }
        return states;
    }

    /**
     * Get statistics about the algorithm performance
     * @returns {object}
     */
    getStats() {
        return {
            visitedFloors: this.visitedFloors,
            totalMoves: this.visitedFloors.length,
            pendingRequests: Array.from(this.requests)
        };
    }

    /**
     * Reset the elevator to initial state
     */
    reset() {
        this.currentFloor = 0;
        this.direction = 1;
        this.requests.clear();
        this.visitedFloors = [];
    }
}

// Example usage:
// const elevator = new ScanElevator(10);
// elevator.addRequest(5);
// elevator.addRequest(3);
// elevator.addRequest(7);
// const states = elevator.runComplete();
