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
    }

    addRequest(pickup, destination) {
        // Smart validation
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
        // Merge pickups and onboard drop-offs in STRICT order by requestId (FCFS)
        const combined = [];

        // Add all pickups with their original requestId order
        this.pickupQueue.forEach(req => {
            combined.push({
                floor: req.floor,
                type: 'pickup',
                destination: req.destination,
                requestId: req.requestId,
                sortKey: req.requestId * 2 // Even numbers for pickups
            });
        });

        // Add all onboard destinations
        // Drop-offs should happen right after their pickup
        this.onboardQueue.forEach(req => {
            combined.push({
                floor: req.destination,
                type: 'dropoff',
                requestId: req.requestId,
                sortKey: req.requestId * 2 + 1 // Odd numbers right after pickups
            });
        });

        // Sort by sortKey to maintain FCFS order: pickup0, dropoff0, pickup1, dropoff1, etc.
        combined.sort((a, b) => a.sortKey - b.sortKey);

        return combined;
    }

    step() {
        this.stepCount++;

        const combined = this.getCombinedQueue();

        if (combined.length === 0) {
            this.direction = 'IDLE';
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

        // Check if at target floor
        if (this.currentFloor === targetFloor) {
            if (nextRequest.type === 'pickup') {
                // Board passenger
                const pickupIdx = this.pickupQueue.findIndex(r => r.requestId === nextRequest.requestId);
                if (pickupIdx !== -1) {
                    const req = this.pickupQueue.splice(pickupIdx, 1)[0];
                    this.onboardQueue.push({
                        destination: req.destination,
                        requestId: req.requestId
                    });
                }

                return {
                    floor: this.currentFloor,
                    action: 'serviced',
                    direction: this.direction.toLowerCase(),
                    remainingPickups: [...this.pickupQueue],
                    remainingOnboard: [...this.onboardQueue],
                    served: true,
                    servedType: 'pickup'
                };
            } else {
                // Drop off passenger
                const onboardIdx = this.onboardQueue.findIndex(r => r.requestId === nextRequest.requestId);
                if (onboardIdx !== -1) {
                    this.onboardQueue.splice(onboardIdx, 1);
                }

                return {
                    floor: this.currentFloor,
                    action: 'serviced',
                    direction: this.direction.toLowerCase(),
                    remainingPickups: [...this.pickupQueue],
                    remainingOnboard: [...this.onboardQueue],
                    served: true,
                    servedType: 'dropoff'
                };
            }
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
    }

    get requests() {
        // Return combined set of pickup floors and destinations
        const allFloors = new Set();
        this.pickupQueue.forEach(req => allFloors.add(req.floor));
        this.onboardQueue.forEach(req => allFloors.add(req.destination));
        return allFloors;
    }
}