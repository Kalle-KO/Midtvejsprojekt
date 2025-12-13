# Code Snippets - Core Algorithmic Functions

Dette dokument indeholder de mest centrale dele af vores tre elevator-algoritmer. Disse funktioner viser essensen af hvordan hver algoritme træffer beslutninger.

---

## SSTF - Shortest Seek Time First

### `findClosestRequest()` - Greedy Nearest-Neighbor Selection

Dette er **hjertet af SSTF-algoritmen**. Hver gang elevatoren skal beslutte hvor den skal hen, scanner den gennem alle pending requests (både pickups og dropoffs) og vælger den der er tættest på.

```javascript
findClosestRequest() {
    if (this.pickupQueue.length === 0 && this.onboardQueue.length === 0) {
        return null;
    }

    let closestRequest = null;
    let minDistance = Infinity;

    // Check all pickup requests (guests waiting on floors)
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

    // Check all dropoff requests (passengers already onboard)
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
```

**Kompleksitet:** O(n) hvor n = antal pending requests (pickup + onboard)

**Hvorfor denne funktion er central:**
- Dette er den **greedy decision** der definerer SSTF
- Den vælger altid den nærmeste request uden at tænke på fremtidige consequences
- Dette giver excellent average-case performance men kan føre til starvation
- Sammenligner både pickups og dropoffs - behandler dem lige

**Algoritme-flow:**
1. Hvis ingen requests → return null (elevator går idle)
2. Scan gennem alle pickup requests, beregn distance fra current floor
3. Scan gennem alle onboard dropoff requests, beregn distance
4. Return den request med mindst distance

**Trade-off:**
- **Pro:** Minimerer immediate movement, excellent for clustered traffic
- **Con:** Kan ignorere distant requests i lang tid (starvation problem)

---

## SCAN - Elevator Algorithm

### `getRequestsInDirection()` - Directional Filtering

SCAN's kerne-funktion bestemmer om der er requests i current direction. I modsætning til SSTF der vælger nærmeste, holder SCAN sin retning indtil der ikke er flere requests fremad.

```javascript
getRequestsInDirection() {
    // Filter pickup requests in current direction
    const pickups = this.pickupQueue.filter(req => {
        if (this.direction === 'UP') return req.floor >= this.currentFloor;
        if (this.direction === 'DOWN') return req.floor <= this.currentFloor;
        return true;
    });

    // Filter onboard dropoff requests in current direction
    const dropoffs = this.onboardQueue.filter(req => {
        if (this.direction === 'UP') return req.destination >= this.currentFloor;
        if (this.direction === 'DOWN') return req.destination <= this.currentFloor;
        return true;
    });

    return { 
        pickups, 
        dropoffs, 
        hasAny: pickups.length > 0 || dropoffs.length > 0 
    };
}
```

**Kompleksitet:** O(n) hvor n = antal pending requests

**Hvorfor denne funktion er central:**
- Dette er den **directional logic** der definerer SCAN
- Den sikrer at elevatoren servicerer alle requests i current direction før den vender
- Dette giver **predictability** og **fairness** - bounded wait time
- Behandler både pickups og dropoffs i samme sweep

### `step()` - Direction Switching Logic (uddrag)

Dette viser hvordan SCAN beslutter at vende retning:

```javascript
step() {
    // ... servicing logic ...

    // Check if there are any requests in current direction
    const { hasAny } = this.getRequestsInDirection();

    // If no requests ahead, switch direction
    if (!hasAny) {
        this.direction = this.direction === 'UP' ? 'DOWN' : 'UP';
    }

    // Move one floor in current direction
    if (this.direction === 'UP') {
        this.currentFloor++;
    } else {
        this.currentFloor--;
    }
    this.totalMoves++;

    // ... boundary checking ...
}
```

**Algoritme-flow:**
1. Service current floor (pickups/dropoffs hvis nogen)
2. Tjek om der er requests i current direction
3. Hvis ikke → switch direction
4. Move én floor i current direction
5. Repeat

**Trade-off:**
- **Pro:** Predictable, fair, bounded worst-case wait time
- **Con:** Kan køre til empty floors hvis traffic er clustered

---

## FCFS - First Come First Serve

### `getCombinedQueue()` - Temporal Ordering

FCFS's centrale funktion kombinerer alle requests (pickups og dropoffs) i én sorteret queue baseret på arrival time (requestId). Dette er **hvorfor FCFS er ineffektiv** - den ignorerer spatial information.

```javascript
getCombinedQueue() {
    const combined = [];

    // Add all pickup requests with priority based on requestId
    this.pickupQueue.forEach(req => {
        combined.push({
            floor: req.floor,
            type: 'pickup',
            destination: req.destination,
            requestId: req.requestId,
            sortKey: req.requestId * 2  // Even numbers for pickups
        });
    });

    // Add all dropoff requests with slightly higher priority
    this.onboardQueue.forEach(req => {
        combined.push({
            floor: req.destination,
            type: 'dropoff',
            requestId: req.requestId,
            sortKey: req.requestId * 2 + 1  // Odd numbers for dropoffs
        });
    });

    // Sort by temporal order (when request was made)
    combined.sort((a, b) => a.sortKey - b.sortKey);

    return combined;
}
```

**Kompleksitet:** O(n log n) hvor n = antal pending requests (due to sorting)

**Hvorfor denne funktion er central:**
- Dette viser **fundamental misforståelse** af elevator-problemet
- FCFS behandler spatial problem som en temporal queue
- Sorting er O(n log n) - værre end SSTF/SCAN's O(n)
- Men den reelle inefficiency kommer fra **directional thrashing**, ikke CPU cost

### `step()` - The Consequence of Temporal Ordering (uddrag)

```javascript
step() {
    // Get next request in temporal order
    const combined = this.getCombinedQueue();
    
    if (combined.length === 0) {
        this.direction = 'IDLE';
        return {...};
    }

    // Always go to the OLDEST request first (regardless of distance)
    const nextRequest = combined[0];
    const targetFloor = nextRequest.floor;

    // Move toward target (could be anywhere in building)
    const direction = targetFloor > this.currentFloor ? 1 : -1;
    this.currentFloor += direction;
    this.totalMoves++;
    this.direction = direction === 1 ? 'UP' : 'DOWN';

    // ... servicing logic ...
}
```

**Algoritme-flow:**
1. Sort all requests by arrival time
2. Pick oldest request (head of queue)
3. Move toward that floor
4. Service when arriving
5. Repeat → ofte resulterer i zig-zag pattern

**Eksempel på inefficiency:**
```
Requests in order of arrival:
1. Floor 1 → 10 (arrived at t=0)
2. Floor 5 → 7  (arrived at t=1)
3. Floor 2 → 8  (arrived at t=2)

FCFS route: 1 → 10 → 5 → 7 → 2 → 8
Distance: 9 + 5 + 2 + 5 + 6 = 27 moves

SSTF route: 1 → 2 → 5 → 7 → 8 → 10
Distance: 1 + 3 + 2 + 1 + 2 = 9 moves

FCFS bruger 3x så mange moves!
```

**Trade-off:**
- **Pro:** Simpel at implementere, "fair" i temporal sense
- **Con:** Ignorerer spatial information → massive inefficiency
- **Con:** Directional thrashing → 31-67% flere moves end optimerede algoritmer

---

## Sammenligning af Beslutningslogik

### Scenario: Elevator på etage 5 med følgende requests:

```
Pickup requests:
- Floor 2 (request #1, arrived t=0)
- Floor 8 (request #2, arrived t=1)
- Floor 6 (request #3, arrived t=2)

Onboard requests:
- Destination floor 7 (request #0, onboard)
```

**SSTF beslutter:**
```javascript
distances = {
    floor 2: |5-2| = 3,
    floor 8: |5-8| = 3,
    floor 6: |5-6| = 1,  ← CLOSEST
    floor 7: |5-7| = 2
}
→ Vælger floor 6 (pickup)
```

**SCAN beslutter (assuming direction = UP):**
```javascript
requestsInDirection = {
    pickups: [floor 6, floor 8],  // >= 5
    dropoffs: [floor 7]            // >= 5
}
→ Fortsætter UP, servicerer floor 6 først (nærmeste i direction)
```

**FCFS beslutter:**
```javascript
sortedRequests = [
    {floor: 2, sortKey: 2},  ← OLDEST
    {floor: 8, sortKey: 4},
    {floor: 6, sortKey: 6}
]
→ Vælger floor 2 (må gå DOWN selv om elevator lige kom UP)
```

Dette viser tydeligt forskellen:
- **SSTF:** Greedy optimization (vælg nærmeste)
- **SCAN:** Directional consistency (fortsæt retning)
- **FCFS:** Temporal fairness (ignorer location)

---

## Wait Time Tracking - Fælles for alle algoritmer

En critical del af vores metrics er wait time tracking. Dette er identisk for alle tre algoritmer:

```javascript
// In ElevatorVisualizer class

// Called when a new request is added
trackRequest(floor, currentStep) {
    if (!this.requestSteps.has(floor)) {
        this.requestSteps.set(floor, []);
    }
    this.requestSteps.get(floor).push(currentStep);
}

// Called when elevator services a floor
trackServed(floor, currentStep) {
    if (this.requestSteps.has(floor)) {
        const steps = this.requestSteps.get(floor);
        if (steps.length > 0) {
            const requestStep = steps.shift();  // Get oldest request at this floor
            const waitTime = currentStep - requestStep;
            this.waitTimes.push(waitTime);
            this.servedCount++;

            if (steps.length === 0) {
                this.requestSteps.delete(floor);
            }
        }
    }
}

// Calculate metrics
getMetrics() {
    const avgWait = this.waitTimes.length > 0
        ? Math.round(this.waitTimes.reduce((a, b) => a + b, 0) / this.waitTimes.length)
        : 0;

    const maxWait = this.waitTimes.length > 0
        ? Math.max(...this.waitTimes)
        : 0;

    return {
        avgWait,
        maxWait,
        served: this.servedCount,
        totalMoves: this.elevator.totalMoves || 0
    };
}
```

**Hvorfor dette er vigtigt:**
- Wait time måles i **steps** (logical operations), ikke milliseconds
- Giver **fair comparison** - algorithms measured by same metric
- Trackes per floor med FIFO queue (første request på floor venter længst)
- Metrics beregnes kun fra successfully served requests

---

## Key Takeaways fra Koden

1. **SSTF's `findClosestRequest()`** viser greedy optimization - simple men kan føre til starvation
2. **SCAN's `getRequestsInDirection()`** viser directional consistency - mere kompleks logik men guarantees fairness
3. **FCFS's `getCombinedQueue()`** viser temporal ordering - simplest mental model men worst performance
4. Alle bruger **step-based metrics** for scientific validity
5. Wait time tracking er **identisk for alle** - fair comparison basis

Disse code snippets demonstrerer at **algoritme design matters more than implementation complexity**. FCFS's O(n log n) sorting er ikke problemet - det er den fundamentale approach til problemet der gør forskellen.
