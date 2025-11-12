/**
 * FCFS Elevator Algorithm (First-Come, First-Served)
 * Simple but inefficient - serves requests in the order they arrive.
 * No optimization for direction or distance.
 */

class FcfsElevator {
    constructor(numFloors = 10) {
        this.numFloors = numFloors; // Number of floors
        this.currentFloor = 0;
        this.requestQueue = []; // Queue of floor requests in order received
        this.visitedFloors = []; // Track the order of visited floors
    }

    /**
     * Add a floor request to the queue
     * @param {number} floor - The floor number to visit
     */
    addRequest(floor) {
        if (floor >= 0 && floor < this.numFloors) {
            this.requestQueue.push(floor);
        }
    }

    /**
     * Get the current direction based on next target
     * @returns {number} - 1 for up, -1 for down, 0 for idle
     */
    getCurrentDirection() {
        if (this.requestQueue.length === 0) {
            return 0; // Idle
        }
        const nextFloor = this.requestQueue[0];
        if (nextFloor > this.currentFloor) {
            return 1; // Going up
        } else if (nextFloor < this.currentFloor) {
            return -1; // Going down
        }
        return 0; // Already at target floor
    }

    /**
     * Move to the next floor according to FCFS algorithm
     * @returns {object} - Current state with floor and action
     */
    step() {
        // If no requests, stay idle
        if (this.requestQueue.length === 0) {
            return {
                floor: this.currentFloor,
                action: 'idle',
                direction: 'idle',
                remainingRequests: []
            };
        }

        const targetFloor = this.requestQueue[0];

        // If we're at the target floor, service it
        if (this.currentFloor === targetFloor) {
            this.requestQueue.shift(); // Remove the serviced request
            this.visitedFloors.push(this.currentFloor);
            return {
                floor: this.currentFloor,
                action: 'serviced',
                direction: this.getCurrentDirection() === 1 ? 'up' :
                          this.getCurrentDirection() === -1 ? 'down' : 'idle',
                remainingRequests: [...this.requestQueue]
            };
        }

        // Move one floor towards the target
        const direction = targetFloor > this.currentFloor ? 1 : -1;
        this.currentFloor += direction;

        return {
            floor: this.currentFloor,
            action: 'moving',
            direction: direction === 1 ? 'up' : 'down',
            targetFloor: targetFloor,
            remainingRequests: [...this.requestQueue]
        };
    }

    /**
     * Run the complete algorithm until all requests are serviced
     * @returns {array} - Array of all states
     */
    runComplete() {
        const states = [];
        while (this.requestQueue.length > 0) {
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
     * Calculate total distance traveled
     * @returns {number}
     */
    calculateTotalDistance() {
        let distance = 0;
        let currentPos = 0;

        for (let floor of this.visitedFloors) {
            distance += Math.abs(floor - currentPos);
            currentPos = floor;
        }

        return distance;
    }

    /**
     * Get statistics about the algorithm performance
     * @returns {object}
     */
    getStats() {
        return {
            visitedFloors: this.visitedFloors,
            totalStops: this.visitedFloors.length,
            totalDistance: this.calculateTotalDistance(),
            pendingRequests: [...this.requestQueue]
        };
    }

    /**
     * Reset the elevator to initial state
     */
    reset() {
        this.currentFloor = 0;
        this.requestQueue = [];
        this.visitedFloors = [];
    }
}

// Example usage:
// const elevator = new FcfsElevator(10);
// elevator.addRequest(5);
// elevator.addRequest(3);
// elevator.addRequest(7);
// const states = elevator.runComplete();
// console.log(elevator.getStats());
