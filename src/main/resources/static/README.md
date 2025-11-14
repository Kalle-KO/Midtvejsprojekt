# Elevator Simulator - Guest Tracking System

## Oversigt

Dette projekt sammenligner forskellige elevator-algoritmer med fokus på gæst-tracking og ventetidsanalyse.

### Filer

- **guest.js** - Guest class til at tracke individuelle gæster
- **fcfs.js** - First-Come-First-Served algoritme
- **scan.js** - SCAN algoritme (fortsætter i én retning)
- **test-comparison.js** - Test scenarier og sammenligningsfunktioner
- **script.js** - UI integration
- **index.html** - Hovedside med visualization

## Hvordan Guest-systemet virker

### Guest Class
Hver gæst har:
- `startFloor` - Hvor de venter
- `destinationFloor` - Hvor de skal hen
- `arrivalStep` - Hvornår de kaldte på elevatoren
- `pickupStep` - Hvornår elevatoren hentede dem
- `dropoffStep` - Hvornår de nåede deres destination
- `state` - 'waiting', 'riding', eller 'delivered'

### Metrics
- **Wait Time** - Steps fra arrival til pickup (pickupStep - arrivalStep)
- **Total Time** - Steps fra arrival til dropoff (dropoffStep - arrivalStep)
- **Average Wait Time** - Gennemsnit for alle gæster
- **Max Wait Time** - Længste ventetid for én gæst

## Brug i Browser Console

Åbn index.html i en browser og åbn console (F12).

### Kør standard test:
```javascript
runAllTests();
```

### Kør enkelt sammenligning:
```javascript
const guests = generateTestScenario();
runComparison(guests);
```

### Kør specifik algoritme:
```javascript
// FCFS
const fcfs = new FcfsElevator(10);
const guests = generateTestScenario();
guests.forEach(g => fcfs.addGuest(g));
fcfs.runComplete();
console.log(fcfs.getStats());
displayGuestDetails(fcfs);

// SCAN
const scan = new ScanElevator(10);
const guests2 = generateTestScenario();
guests2.forEach(g => scan.addGuest(g));
scan.runComplete();
console.log(scan.getStats());
displayGuestDetails(scan);
```

### Tilpas test scenario:
```javascript
Guest.nextId = 1; // Reset ID counter
const customGuests = [
    new Guest(0, 5, 0),   // Floor 0 → 5, arrives at step 0
    new Guest(3, 7, 2),   // Floor 3 → 7, arrives at step 2
    new Guest(9, 1, 5)    // Floor 9 → 1, arrives at step 5
];

runComparison(customGuests);
```

## Test Scenarier

### 1. Standard Scenario (`generateTestScenario()`)
10 gæster med tilfældige start/destination etager fordelt over tid

### 2. Rush Hour (`generateRushHourScenario()`)
Mange gæster fra stueetagen der skal op (simulerer morgen rush)

### 3. Floor Hogging (`generateFloorHoggingScenario()`)
Gæster der hopper frem og tilbage mellem få etager

## Hvordan Algoritmerne Virker

### FCFS (First-Come-First-Served)
1. Serverer gæster i præcis den rækkefølge de ankommer
2. Prioriterer drop-offs før nye pickups
3. Ingen optimering for retning eller afstand
4. **Fordele**: Simpel, fair
5. **Ulemper**: Ineffektiv, meget bevægelse

### SCAN
1. Fortsætter i én retning indtil ingen flere requests
2. Vender om når der ikke er flere i nuværende retning
3. Samler op og sætter af undervejs
4. **Fordele**: Effektiv, færre steps
5. **Ulemper**: Gæster i modsat retning kan vente længe

## Output Eksempel

```
=== ELEVATOR ALGORITHM COMPARISON ===
Testing with 10 guests

--- FCFS Algorithm ---
Total Steps: 156
Average Wait Time: 45.30 steps
Max Wait Time: 89 steps
Average Total Time: 78.60 steps
Guests Delivered: 10

--- SCAN Algorithm ---
Total Steps: 124
Average Wait Time: 32.10 steps
Max Wait Time: 65 steps
Average Total Time: 61.40 steps
Guests Delivered: 10

--- Comparison ---
SCAN was 20.5% faster in total steps
SCAN had 29.1% better average wait time
```

## Step Tracking

Hver gang elevatoren bevæger sig én etage = 1 step.

For hver step:
- Alle ventende gæster får deres ventetid øget
- Elevatoren kan være i én af disse states:
  - `moving` - Bevæger sig mod næste mål
  - `pickup` - Henter gæst(er)
  - `dropoff` - Sætter gæst(er) af
  - `reversed` - Vender retning (kun SCAN)
  - `idle` - Ingen requests

## Udvid Systemet

For at tilføje en ny algoritme:
1. Opret ny fil (f.eks. `look.js`)
2. Implementer samme interface som FCFS/SCAN
3. Inkluder i index.html
4. Tilføj test case i test-comparison.js
