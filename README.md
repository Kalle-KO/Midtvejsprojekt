# The Elevator Simulator :)

Midtvejsprojekt 2025
Datastrukturer og Algoritmer

**Gruppe:** Kalle og Magnus

## Description

This project compares three elevator scheduling algorithms:
- **FCFS (First Come First Serve)** - Processes requests in order
- **SCAN** - Sweeps up and down serving requests (this is the commonly used elevator algorithm aoround the world)
- **Rush Hour Optimization** - Prioritizes directional batching

## How to Run

Open `src/main/resources/static/index.html` in your web browser.


## Scenarios

- **Baseline Test** - Balanced traffic across all floors
- **Rush Hour** - Morning commute pattern (80% upward from floor 1)
- **Floor Hogging** - Short trips monopolizing the elevator

Toggle **Continuous Mode** to keep adding random requests indefinitely.
