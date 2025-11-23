class RushHourElevator {
    constructor(numFloors = 10) {
        this.numFloors = numFloors;
        this.currentFloor = 1;
        this.direction = 'UP';
        this.requests = new Set();
        this.upRequests = new Set();
        this.downRequests = new Set();
        this.totalMoves = 0;
        this.stepCount = 0;
    }

    addRequest(floor, direction = null) {
        if (floor < 1 || floor > this.numFloors) return;

        this.requests.add(floor);

        if (direction === 'UP') {
            this.upRequests.add(floor);
        } else if (direction === 'DOWN') {
            this.downRequests.add(floor);
        }
        
    }

    getNextFloor() {
        if (this.requests.size === 0) return null;

        const relevantRequests = this.direction === 'UP' ? this.upRequests : this.downRequests;

        const floorsInDirection = Array.from(relevantRequests).filter(floor => {
            return this.direction === 'UP' ? floor >= this.currentFloor : floor <= this.currentFloor;
        });

        if (floorsInDirection.length > 0) {
            return this.direction === 'UP'
                ? Math.min(...floorsInDirection)
                : Math.max(...floorsInDirection);
        }

        const oppositeRequests = this.direction === 'UP' ? this.downRequests : this.upRequests;
        const floorsInOpposite = Array.from(oppositeRequests);

        if (floorsInOpposite.length > 0) {
            this.direction = this.direction === 'UP' ? 'DOWN' : 'UP';

            return this.direction === 'UP'
                ? Math.min(...floorsInOpposite)
                : Math.max(...floorsInOpposite);
        }

        return Array.from(this.requests)[0];
    }

    step() {
        this.stepCount++;

        const nextFloor = this.getNextFloor();

        if (nextFloor === null) {
            this.direction = 'IDLE';
            return { done: true, currentFloor: this.currentFloor, direction: this.direction, served: false };
        }

        if (nextFloor > this.currentFloor) {
            this.currentFloor++;
            this.totalMoves++;
        } else if (nextFloor < this.currentFloor) {
            this.currentFloor--;
            this.totalMoves++;
        }

        let served = false;
        if (this.requests.has(this.currentFloor)) {
            this.requests.delete(this.currentFloor);
            this.upRequests.delete(this.currentFloor);
            this.downRequests.delete(this.currentFloor);
            served = true;

            // Hvis der ikke er flere requests, sæt til IDLE
            if (this.requests.size === 0) {
                this.direction = 'IDLE';
            }
        }

        return {
            done: false,
            currentFloor: this.currentFloor,
            direction: this.direction,
            served: served,
            remaining: this.requests.size
        };
    }

    reset() {
        this.currentFloor = 1;
        this.direction = 'UP';
        this.requests.clear();
        this.upRequests.clear();
        this.downRequests.clear();
        this.totalMoves = 0;
        this.stepCount = 0;
    }
}