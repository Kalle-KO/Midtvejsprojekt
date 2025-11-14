/**
 * Guest class
 * Represents an individual guest waiting for the elevator
 */
class Guest {
    static nextId = 1;

    constructor(startFloor, destinationFloor, arrivalStep) {
        this.id = Guest.nextId++;
        this.startFloor = startFloor; // Where they're waiting
        this.destinationFloor = destinationFloor; // Where they want to go
        this.arrivalStep = arrivalStep; // When they called the elevator
        this.pickupStep = null; // When elevator picked them up
        this.dropoffStep = null; // When they reached destination
        this.state = 'waiting'; // 'waiting', 'riding', 'delivered'
    }

    /**
     * Calculate total wait time (from arrival to pickup)
     */
    getWaitTime() {
        if (this.pickupStep === null) {
            return null; // Still waiting
        }
        return this.pickupStep - this.arrivalStep;
    }

    /**
     * Calculate total journey time (from arrival to dropoff)
     */
    getTotalTime() {
        if (this.dropoffStep === null) {
            return null; // Not delivered yet
        }
        return this.dropoffStep - this.arrivalStep;
    }

    /**
     * Get current wait time (for guests still waiting)
     */
    getCurrentWaitTime(currentStep) {
        if (this.state === 'waiting') {
            return currentStep - this.arrivalStep;
        }
        return this.getWaitTime();
    }
}

// Export for Node.js or browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Guest;
}