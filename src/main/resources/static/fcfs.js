class FcfsElevator {
    constructor(numFloors = 10) {
        this.numFloors = numFloors;
        this.currentFloor = 1;
        this.requestQueue = [];
        this.totalMoves = 0;
        this.direction = 'IDLE';
        this.stepCount = 0;
    }

    addRequest(floor) {
        if (floor >= 1 && floor <= this.numFloors) {
            this.requestQueue.push(floor);
        }
    }

    getCurrentDirection() {
        if (this.requestQueue.length === 0) {
            return 0;
        }
        const nextFloor = this.requestQueue[0];
        if (nextFloor > this.currentFloor) {
            return 1;
        } else if (nextFloor < this.currentFloor) {
            return -1;
        }
        return 0;
    }

    step() {
        this.stepCount++;

        if (this.requestQueue.length === 0) {
            this.direction = 'IDLE';
            return {
                floor: this.currentFloor,
                action: 'idle',
                direction: 'idle',
                remainingRequests: [],
                served: false
            };
        }

        const targetFloor = this.requestQueue[0];

        // First check if we're already at the target floor - serve it immediately
        let served = false;
        if (this.currentFloor === targetFloor) {
            this.requestQueue.shift();
            served = true;

            // Update direction for next request if any
            if (this.requestQueue.length === 0) {
                this.direction = 'IDLE';
                return {
                    floor: this.currentFloor,
                    action: 'serviced',
                    direction: 'idle',
                    remainingRequests: [],
                    served: true
                };
            } else {
                const nextDir = this.getCurrentDirection();
                if (nextDir === 1) this.direction = 'UP';
                else if (nextDir === -1) this.direction = 'DOWN';
                else this.direction = 'IDLE';
            }
        } else {
            // Move towards target
            const direction = targetFloor > this.currentFloor ? 1 : -1;
            this.currentFloor += direction;
            this.totalMoves++;
            this.direction = direction === 1 ? 'UP' : 'DOWN';
        }

        return {
            floor: this.currentFloor,
            action: served ? 'serviced' : 'moving',
            direction: this.direction.toLowerCase(),
            targetFloor: targetFloor,
            remainingRequests: [...this.requestQueue],
            served: served
        };
    }

    reset() {
        this.currentFloor = 1;
        this.requestQueue = [];
        this.totalMoves = 0;
        this.direction = 'IDLE';
        this.stepCount = 0;
    }

    get requests() {
        return new Set(this.requestQueue);
    }
}