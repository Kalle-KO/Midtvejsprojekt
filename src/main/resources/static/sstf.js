class SstfElevator {
    constructor(numFloors = 10) {
        this.numFloors = numFloors;
        this.currentFloor = 1;
        this.direction = 'IDLE';
        this.pickupQueue = [];
        this.onboardQueue = [];
        this.nextRequestId = 0;
        this.totalMoves = 0;
        this.stepCount = 0;
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

    findClosestRequest() {
        if (this.pickupQueue.length === 0 && this.onboardQueue.length === 0) {
            return null;
        }

        let closestRequest = null;
        let minDistance = Infinity;

        this.pickupQueue.forEach(req => {
            const distance = Math.abs(this.currentFloor - req.floor);
            if (distance < minDistance) {
                minDistance = distance;
                closestRequest = {
                    floor: req.floor,
                    type: 'pickup',
                    destination: req.destination,
                    requestId: req.requestId
                };
            }
        });

        this.onboardQueue.forEach(req => {
            const distance = Math.abs(this.currentFloor - req.destination);
            if (distance < minDistance) {
                minDistance = distance;
                closestRequest = {
                    floor: req.destination,
                    type: 'dropoff',
                    requestId: req.requestId
                };
            }
        });

        return closestRequest;
    }

    step() {
        this.stepCount++;

        if (this.pickupQueue.length === 0 && this.onboardQueue.length === 0) {
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
            if (this.pickupQueue.length === 0 && this.onboardQueue.length === 0) {
                this.direction = 'IDLE';
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

        const closest = this.findClosestRequest();

        if (!closest) {
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

        if (closest.floor > this.currentFloor) {
            this.currentFloor++;
            this.direction = 'UP';
        } else if (closest.floor < this.currentFloor) {
            this.currentFloor--;
            this.direction = 'DOWN';
        } else {
            this.direction = 'IDLE';
        }

        this.totalMoves++;

        return {
            floor: this.currentFloor,
            action: 'moving',
            direction: this.direction.toLowerCase(),
            remainingPickups: [...this.pickupQueue],
            remainingOnboard: [...this.onboardQueue],
            served: false
        };
    }

    reset() {
        this.currentFloor = 1;
        this.direction = 'IDLE';
        this.pickupQueue = [];
        this.onboardQueue = [];
        this.nextRequestId = 0;
        this.totalMoves = 0;
        this.stepCount = 0;
    }

    get requests() {
        const allFloors = new Set();
        this.pickupQueue.forEach(req => allFloors.add(req.floor));
        this.onboardQueue.forEach(req => allFloors.add(req.destination));
        return allFloors;
    }
}