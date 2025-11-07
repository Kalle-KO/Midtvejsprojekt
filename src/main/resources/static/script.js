function selectAlgorithm(type) {
    const text = {
        baseline: "Standard elevator-algoritme: kører sekventielt op og ned.",
        rushhour: "Rush hour: prioriterer etager med flest kald i samme retning.",
        floorhogging: "Floor hogging: håndterer gentagne kald mellem få etager."
    };

    document.getElementById("currentAlgorithm").textContent = text[type] || "Ukendt algoritme";
    drawElevator(type);
}

function drawElevator(type) {
    const ctx = document.getElementById("elevatorCanvas").getContext("2d");
    ctx.clearRect(0, 0, 300, 400);

    // elevator shaft
    ctx.strokeStyle = "#aaa";
    ctx.strokeRect(120, 20, 60, 360);

    // elevator car
    ctx.fillStyle = "#888";
    ctx.fillRect(120, 300, 60, 80);

    // label
    ctx.fillStyle = "#222";
    ctx.font = "14px system-ui";
    ctx.fillText("Elevator: " + type, 10, 20);
}
