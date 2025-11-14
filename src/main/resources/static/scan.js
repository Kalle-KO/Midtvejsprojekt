/**
 * SCAN Elevator Algorithm
 * Continues in one direction until no more requests, then reverses.
 * Tracks individual guest wait times and journey times.
 */

class ScanElevator {
    constructor(numFloors = 10) {
        this.numFloors = numFloors;
        this.currentFloor = 0;
        this.currentStep = 0;
        this.direction = 1; // 1 for up, -1 for down

        // Guest management
        this.waitingGuests = []; // Guests waiting to be picked up
        this.ridingGuests = []; // Guests currently in elevator
        this.deliveredGuests = []; // Guests who reached destination
    }

    /**
     * Add a guest to the waiting list
     * @param {Guest} guest - Guest object with startFloor and destinationFloor
     */
    addGuest(guest) {
        if (guest.startFloor >= 0 && guest.startFloor < this.numFloors &&
            guest.destinationFloor >= 0 && guest.destinationFloor < this.numFloors) {
            this.waitingGuests.push(guest);
        }
    }

    /**
     * Check if there are pickup requests in current direction
     * @returns {boolean}
     */
    hasPickupsInCurrentDirection() {
        for (let guest of this.waitingGuests) {
            if (this.direction === 1 && guest.startFloor > this.currentFloor) {
                return true;
            }
            if (this.direction === -1 && guest.startFloor < this.currentFloor) {
                return true;
            }
        }
        return false;
    }

    /**
     * Check if there are dropoff requests in current direction
     * @returns {boolean}
     */
    hasDropoffsInCurrentDirection() {
        for (let guest of this.ridingGuests) {
            if (this.direction === 1 && guest.destinationFloor > this.currentFloor) {
                return true;
            }
            if (this.direction === -1 && guest.destinationFloor < this.currentFloor) {
                return true;
            }
        }
        return false;
    }

    /**
     * Check if there are any requests (pickups or dropoffs) in current direction
     * @returns {boolean}
     */
    hasRequestsInCurrentDirection() {
        return this.hasPickupsInCurrentDirection() || this.hasDropoffsInCurrentDirection();
    }

    /**
     * Check if there are any requests in opposite direction
     * @returns {boolean}
     */
    hasRequestsInOppositeDirection() {
        for (let guest of this.waitingGuests) {
            if (this.direction === 1 && guest.startFloor < this.currentFloor) {
                return true;
            }
            if (this.direction === -1 && guest.startFloor > this.currentFloor) {
                return true;
            }
        }
        for (let guest of this.ridingGuests) {
            if (this.direction === 1 && guest.destinationFloor < this.currentFloor) {
                return true;
            }
            if (this.direction === -1 && guest.destinationFloor > this.currentFloor) {
                return true;
            }
        }
        return false;
    }

    /**
     * Execute one simulation step
     * @returns {object} - Current state
     */
    step() {
        this.currentStep++;

        // Check for dropoffs at current floor
        const guestsToDropOff = this.ridingGuests.filter(g => g.destinationFloor === this.currentFloor);
        if (guestsToDropOff.length > 0) {
            const droppedGuests = [];
            for (let guest of guestsToDropOff) {
                guest.dropoffStep = this.currentStep;
                guest.state = 'delivered';
                this.deliveredGuests.push(guest);
                droppedGuests.push(guest.id);
            }
            // Remove from riding list
            this.ridingGuests = this.ridingGuests.filter(g => g.destinationFloor !== this.currentFloor);

            return {
                step: this.currentStep,
                floor: this.currentFloor,
                action: 'dropoff',
                guestIds: droppedGuests,
                count: droppedGuests.length,
                direction: this.direction === 1 ? 'up' : 'down',
                waitingGuests: this.waitingGuests.length,
                ridingGuests: this.ridingGuests.length,
                deliveredGuests: this.deliveredGuests.length
            };
        }

        // Check for pickups at current floor
        const guestsToPickUp = this.waitingGuests.filter(g => g.startFloor === this.currentFloor);
        if (guestsToPickUp.length > 0) {
            const pickedGuests = [];
            const waitTimes = [];
            for (let guest of guestsToPickUp) {
                guest.pickupStep = this.currentStep;
                guest.state = 'riding';
                this.ridingGuests.push(guest);
                pickedGuests.push(guest.id);
                waitTimes.push(guest.getWaitTime());
            }
            // Remove from waiting list
            this.waitingGuests = this.waitingGuests.filter(g => g.startFloor !== this.currentFloor);

            return {
                step: this.currentStep,
                floor: this.currentFloor,
                action: 'pickup',
                guestIds: pickedGuests,
                count: pickedGuests.length,
                waitTimes: waitTimes,
                direction: this.direction === 1 ? 'up' : 'down',
                waitingGuests: this.waitingGuests.length,
                ridingGuests: this.ridingGuests.length,
                deliveredGuests: this.deliveredGuests.length
            };
        }

        // If no more requests, stay idle
        if (this.waitingGuests.length === 0 && this.ridingGuests.length === 0) {
            return {
                step: this.currentStep,
                floor: this.currentFloor,
                action: 'idle',
                direction: this.direction === 1 ? 'up' : 'down',
                waitingGuests: 0,
                ridingGuests: 0,
                deliveredGuests: this.deliveredGuests.length
            };
        }

        // If no requests in current direction, reverse
        if (!this.hasRequestsInCurrentDirection()) {
            if (this.hasRequestsInOppositeDirection()) {
                this.direction *= -1;
                return {
                    step: this.currentStep,
                    floor: this.currentFloor,
                    action: 'reversed',
                    direction: this.direction === 1 ? 'up' : 'down',
                    waitingGuests: this.waitingGuests.length,
                    ridingGuests: this.ridingGuests.length,
                    deliveredGuests: this.deliveredGuests.length
                };
            }
        }

        // Move in current direction
        this.currentFloor += this.direction;

        // Handle boundaries
        if (this.currentFloor < 0) {
            this.currentFloor = 0;
            this.direction = 1;
        } else if (this.currentFloor >= this.numFloors) {
            this.currentFloor = this.numFloors - 1;
            this.direction = -1;
        }

        return {
            step: this.currentStep,
            floor: this.currentFloor,
            action: 'moving',
            direction: this.direction === 1 ? 'up' : 'down',
            waitingGuests: this.waitingGuests.length,
            ridingGuests: this.ridingGuests.length,
            deliveredGuests: this.deliveredGuests.length
        };
    }

    /**
     * Run simulation until all guests are delivered
     * @param {number} maxSteps - Safety limit
     * @returns {array} - Array of all states
     */
    runComplete(maxSteps = 10000) {
        const states = [];

        while (this.waitingGuests.length > 0 || this.ridingGuests.length > 0) {
            const state = this.step();
            states.push(state);

            if (this.currentStep > maxSteps) {
                console.error("Exceeded maximum steps");
                break;
            }
        }

        return states;
    }

    /**
     * Get statistics about elevator performance
     * @returns {object}
     */
    getStats() {
        const waitTimes = this.deliveredGuests.map(g => g.getWaitTime());
        const totalTimes = this.deliveredGuests.map(g => g.getTotalTime());

        const avgWaitTime = waitTimes.length > 0
            ? waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length
            : 0;

        const maxWaitTime = waitTimes.length > 0
            ? Math.max(...waitTimes)
            : 0;

        const avgTotalTime = totalTimes.length > 0
            ? totalTimes.reduce((a, b) => a + b, 0) / totalTimes.length
            : 0;

        return {
            totalSteps: this.currentStep,
            guestsDelivered: this.deliveredGuests.length,
            guestsWaiting: this.waitingGuests.length,
            guestsRiding: this.ridingGuests.length,
            averageWaitTime: avgWaitTime,
            maxWaitTime: maxWaitTime,
            averageTotalTime: avgTotalTime,
            allWaitTimes: waitTimes,
            allTotalTimes: totalTimes
        };
    }

    /**
     * Get detailed guest information
     * @returns {array}
     */
    getGuestDetails() {
        return this.deliveredGuests.map(g => ({
            id: g.id,
            from: g.startFloor,
            to: g.destinationFloor,
            arrivalStep: g.arrivalStep,
            pickupStep: g.pickupStep,
            dropoffStep: g.dropoffStep,
            waitTime: g.getWaitTime(),
            totalTime: g.getTotalTime()
        }));
    }

    /**
     * Reset the elevator
     */
    reset() {
        this.currentFloor = 0;
        this.currentStep = 0;
        this.direction = 1;
        this.waitingGuests = [];
        this.ridingGuests = [];
        this.deliveredGuests = [];
    }
}

// Export for Node.js or browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ScanElevator;
}