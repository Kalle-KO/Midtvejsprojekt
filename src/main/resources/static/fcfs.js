class FcfsElevator {
    constructor(numFloors = 10) {
        this.numFloors = numFloors;
        this.currentFloor = 1;
        this.pickupQueue = [];
        this.onboardQueue = [];
        this.nextRequestId = 0;
        this.totalMoves = 0;
        this.direction = 'IDLE';
        this.stepCount = 0;
        this.servicingFloor = null;  // Track current servicing floor
    }

    addRequest(pickup, destination) {
        if (pickup === destination) {
            console.warn(`Invalid request: pickup and destination are the same (floor ${pickup})`);
            return false;
        }

        if (pickup < 1 || pickup > this.numFloors ||
            destination < 1 || destination > this.numFloors) {
            console.warn(`Invalid request: floors out of range`);
            return false;
        }

        this.pickupQueue.push({
            floor: pickup,
            destination: destination,
            requestId: this.nextRequestId++
        });
        return true;
    }

    getCombinedQueue() {
        const combined = [];

        this.pickupQueue.forEach(req => {
            combined.push({
                floor: req.floor,
                type: 'pickup',
                destination: req.destination,
                requestId: req.requestId,
                sortKey: req.requestId * 2
            });
        });

        this.onboardQueue.forEach(req => {
            combined.push({
                floor: req.destination,
                type: 'dropoff',
                requestId: req.requestId,
                sortKey: req.requestId * 2 + 1
            });
        });

        combined.sort((a, b) => a.sortKey - b.sortKey);

        return combined;
    }

    step() {
        this.stepCount++;

        const combined = this.getCombinedQueue();

        if (combined.length === 0) {
            this.direction = 'IDLE';
            this.servicingFloor = null;
            return {
                floor: this.currentFloor,
                action: 'idle',
                direction: 'idle',
                remainingPickups: [],
                remainingOnboard: [],
                served: false
            };
        }

        const nextRequest = combined[0];
        const targetFloor = nextRequest.floor;

        // Mark floor for servicing when we arrive at target
        if (this.currentFloor === targetFloor && this.servicingFloor === null) {
            this.servicingFloor = this.currentFloor;
        }

        // Service if we're on a marked servicing floor
        if (this.servicingFloor === this.currentFloor) {
            const hasDropoffHere = this.onboardQueue.some(r => r.destination === this.currentFloor);
            const hasPickupHere = this.pickupQueue.some(r => r.floor === this.currentFloor);

            if (hasDropoffHere || hasPickupHere) {
                let served = false;
                let servedType = null;

                const dropoffIdx = this.onboardQueue.findIndex(r => r.destination === this.currentFloor);
                if (dropoffIdx !== -1) {
                    this.onboardQueue.splice(dropoffIdx, 1);
                    served = true;
                    servedType = 'dropoff';
                }

                if (!served) {
                    const pickupIdx = this.pickupQueue.findIndex(r => r.floor === this.currentFloor);
                    if (pickupIdx !== -1) {
                        const req = this.pickupQueue.splice(pickupIdx, 1)[0];
                        this.onboardQueue.push({
                            destination: req.destination,
                            requestId: req.requestId
                        });
                        served = true;
                        servedType = 'pickup';
                    }
                }

                if (served) {
                    const newCombined = this.getCombinedQueue();
                    if (newCombined.length === 0) {
                        this.direction = 'IDLE';
                    } else {
                        const nextFloor = newCombined[0].floor;
                        if (nextFloor > this.currentFloor) {
                            this.direction = 'UP';
                        } else if (nextFloor < this.currentFloor) {
                            this.direction = 'DOWN';
                        } else {
                            this.direction = 'IDLE';
                        }
                    }

                    return {
                        floor: this.currentFloor,
                        action: 'serviced',
                        direction: this.direction.toLowerCase(),
                        remainingPickups: [...this.pickupQueue],
                        remainingOnboard: [...this.onboardQueue],
                        served: true,
                        servedType: servedType
                    };
                }
            }

            // No more people at this servicing floor - clear flag
            this.servicingFloor = null;
        }

        // Move toward target
        const direction = targetFloor > this.currentFloor ? 1 : -1;
        this.currentFloor += direction;
        this.totalMoves++;
        this.direction = direction === 1 ? 'UP' : 'DOWN';

        return {
            floor: this.currentFloor,
            action: 'moving',
            direction: this.direction.toLowerCase(),
            targetFloor: targetFloor,
            remainingPickups: [...this.pickupQueue],
            remainingOnboard: [...this.onboardQueue],
            served: false
        };
    }

    reset() {
        this.currentFloor = 1;
        this.pickupQueue = [];
        this.onboardQueue = [];
        this.nextRequestId = 0;
        this.totalMoves = 0;
        this.direction = 'IDLE';
        this.stepCount = 0;
        this.servicingFloor = null;
    }

    get requests() {
        const allFloors = new Set();
        this.pickupQueue.forEach(req => allFloors.add(req.floor));
        this.onboardQueue.forEach(req => allFloors.add(req.destination));
        return allFloors;
    }
}