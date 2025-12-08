class ScanElevator {
    constructor(numFloors = 10) {
        this.numFloors = numFloors;
        this.currentFloor = 1;
        this.direction = 'UP';
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

    getRequestsInDirection() {
        const pickups = this.pickupQueue.filter(req => {
            if (this.direction === 'UP') return req.floor >= this.currentFloor;
            if (this.direction === 'DOWN') return req.floor <= this.currentFloor;
            return true;
        });

        const dropoffs = this.onboardQueue.filter(req => {
            if (this.direction === 'UP') return req.destination >= this.currentFloor;
            if (this.direction === 'DOWN') return req.destination <= this.currentFloor;
            return true;
        });

        return { pickups, dropoffs, hasAny: pickups.length > 0 || dropoffs.length > 0 };
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

        if (this.direction === 'IDLE') {
            this.direction = 'UP';
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

        const { hasAny } = this.getRequestsInDirection();

        if (!hasAny) {
            this.direction = this.direction === 'UP' ? 'DOWN' : 'UP';
        }

        if (this.direction === 'UP') {
            this.currentFloor++;
        } else {
            this.currentFloor--;
        }
        this.totalMoves++;

        if (this.currentFloor < 1) {
            this.currentFloor = 1;
            this.direction = 'UP';
        } else if (this.currentFloor > this.numFloors) {
            this.currentFloor = this.numFloors;
            this.direction = 'DOWN';
        }

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
        this.direction = 'UP';
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