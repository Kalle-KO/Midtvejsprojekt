/**
 * FCFS Elevator Algorithm (First-Come, First-Served)
 * Serves guests in the order they call the elevator.
 * Tracks individual guest wait times and journey times.
 */

class FcfsElevator {
    constructor(numFloors = 10) {
        this.numFloors = numFloors;
        this.currentFloor = 0;
        this.currentStep = 0;

        // Guest management
        this.waitingGuests = []; // Guests waiting to be picked up (FIFO queue)
        this.ridingGuests = []; // Guests currently in elevator
        this.deliveredGuests = []; // Guests who reached destination

        // Current task tracking
        this.currentTask = null; // { type: 'pickup'|'dropoff', floor: number, guest: Guest }
    }

    /**
     * Add a guest to the waiting queue
     * @param {Guest} guest - Guest object with startFloor and destinationFloor
     */
    addGuest(guest) {
        if (guest.startFloor >= 0 && guest.startFloor < this.numFloors &&
            guest.destinationFloor >= 0 && guest.destinationFloor < this.numFloors) {
            this.waitingGuests.push(guest);
        }
    }

    /**
     * Get the next task (pickup or dropoff)
     * @returns {object|null} - Next task or null if idle
     */
    getNextTask() {
        // Priority 1: Drop off current passengers first
        if (this.ridingGuests.length > 0) {
            // Find the first passenger in queue order
            const nextGuest = this.ridingGuests[0];
            return {
                type: 'dropoff',
                floor: nextGuest.destinationFloor,
                guest: nextGuest
            };
        }

        // Priority 2: Pick up next waiting guest
        if (this.waitingGuests.length > 0) {
            const nextGuest = this.waitingGuests[0];
            return {
                type: 'pickup',
                floor: nextGuest.startFloor,
                guest: nextGuest
            };
        }

        return null; // No tasks
    }

    /**
     * Execute one simulation step
     * @returns {object} - Current state
     */
    step() {
        this.currentStep++;

        // Get current or next task
        if (!this.currentTask) {
            this.currentTask = this.getNextTask();
        }

        // If no task, stay idle
        if (!this.currentTask) {
            return {
                step: this.currentStep,
                floor: this.currentFloor,
                action: 'idle',
                waitingGuests: this.waitingGuests.length,
                ridingGuests: this.ridingGuests.length,
                deliveredGuests: this.deliveredGuests.length
            };
        }

        const targetFloor = this.currentTask.floor;

        // If we're at the target floor, execute the task
        if (this.currentFloor === targetFloor) {
            if (this.currentTask.type === 'pickup') {
                // Pick up the guest
                const guest = this.currentTask.guest;
                guest.pickupStep = this.currentStep;
                guest.state = 'riding';

                // Move from waiting to riding
                this.waitingGuests.shift();
                this.ridingGuests.push(guest);

                const result = {
                    step: this.currentStep,
                    floor: this.currentFloor,
                    action: 'pickup',
                    guestId: guest.id,
                    waitTime: guest.getWaitTime(),
                    destination: guest.destinationFloor,
                    waitingGuests: this.waitingGuests.length,
                    ridingGuests: this.ridingGuests.length,
                    deliveredGuests: this.deliveredGuests.length
                };

                this.currentTask = null; // Clear task
                return result;

            } else if (this.currentTask.type === 'dropoff') {
                // Drop off the guest
                const guest = this.currentTask.guest;
                guest.dropoffStep = this.currentStep;
                guest.state = 'delivered';

                // Move from riding to delivered
                this.ridingGuests.shift();
                this.deliveredGuests.push(guest);

                const result = {
                    step: this.currentStep,
                    floor: this.currentFloor,
                    action: 'dropoff',
                    guestId: guest.id,
                    totalTime: guest.getTotalTime(),
                    waitingGuests: this.waitingGuests.length,
                    ridingGuests: this.ridingGuests.length,
                    deliveredGuests: this.deliveredGuests.length
                };

                this.currentTask = null; // Clear task
                return result;
            }
        }

        // Move one floor towards the target
        const direction = targetFloor > this.currentFloor ? 1 : -1;
        this.currentFloor += direction;

        return {
            step: this.currentStep,
            floor: this.currentFloor,
            action: 'moving',
            direction: direction === 1 ? 'up' : 'down',
            targetFloor: targetFloor,
            targetTask: this.currentTask.type,
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
        this.waitingGuests = [];
        this.ridingGuests = [];
        this.deliveredGuests = [];
        this.currentTask = null;
    }
}

// Export for Node.js or browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FcfsElevator;
}