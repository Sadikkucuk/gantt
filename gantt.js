const svg = document.getElementById("gantt-svg");
const taskList = document.getElementById("task-list");

let currentZoom = "day";
const zoomPx = { day: 30, week: 12, month: 6 };

const rowHeight = 40;
const leftOffset = 200;
const topMargin = 30;

// COLOR PALETTE
const levelColors = ["#2E7D32", "#1565C0", "#C62828", "#EF6C00", "#6A1B9A"];

function adjustColor(hex, delta) {
  const num = parseInt(hex.slice(1), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + delta));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 255) + delta));
  const b = Math.min(255, Math.max(0, (num & 255) + delta));
  return `rgb(${r},${g},${b})`;
}

document.getElementById("csvInput").addEventListener("change", e => {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      window.tasks = parseCSV(reader.result);
      if (!window.tasks.length) {
        alert("CSV parsed but no valid tasks found.");
        return;
      }
      renderGantt();
    } catch (err) {
      console.error("Render error:", err);
      alert("JS error. Open browser console (F12).");
    }
  };
  reader.readAsText(e.target.files[0]);
});

function setZoom(z) {
  currentZoom = z;
  if (window.tasks) renderGantt();
}

function renderGantt() {
  svg.innerHTML = "";
  taskList.innerHTML = "";

  const dates = window.tasks.flatMap(t => [new Date(t.start), new Date(t.end)]);
  const minDate = new Date(Math.min(...dates));
  const maxDate = new Date(Math.max(...dates));

  const dayWidth = zoomPx[currentZoom];
  const totalDays = Math.max(1, Math.ceil((maxDate - minDate) / 86400000) + 1);

  svg.setAttribute("width", leftOffset + totalDays * dayWidth);
  svg.setAttribute("height", topMargin + window.tasks.length * rowHeight);

  drawGrid(minDate, totalDays, dayWidth);
  drawTasks(minDate, dayWidth);
}

function drawGrid(minDate, totalDays, dayWidth) {
  for (let i = 0; i < totalDays; i++) {
    const x = leftOffset + i * dayWidth;

    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", x);
    line.setAttribute("y1", 0);
    line.setAttribute("x2", x);
    line.setAttribute("y2", svg.getAttribute("height"));
    line.setAttribute("stroke", "#eee");
    svg.appendChild(line);
  }
}

function drawTasks(minDate, dayWidth) {
  window.tasks.forEach((t, i) => {
    const row = document.createElement("div");
    row.className = "task-row";
    row.style.paddingLeft = `${t.level * 14}px`;
    row.textContent = t.name;
    taskList.appendChild(row);

    const y = topMargin + i * rowHeight;
    const xStart = leftOffset + ((new Date(t.start) - minDate) / 86400000) * dayWidth;
    const xEnd = leftOffset + ((new Date(t.end) - minDate) / 86400000) * dayWidth;

    const base = levelColors[(t.level - 1) % levelColors.length];
    const rem = adjustColor(base, 60);
    const done = adjustColor(base, -30);

    if (t.type === "milestone") {
      drawRect(xStart, y + 12, 12, 12, done, true);
    } else {
      drawRect(xStart, y + 10, Math.max(4, xEnd - xStart), 20, rem);
      if (t.progress > 0) {
        drawRect(xStart, y + 10, (xEnd - xStart) * t.progress / 100, 20, done);
      }
    }
  });
}

function drawRect(x, y, w, h, color, milestone = false) {
  const r = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  r.setAttribute("x", x);
  r.setAttribute("y", y);
  r.setAttribute("width", w);
  r.setAttribute("height", h);
  r.setAttribute("fill", color);
  if (milestone) r.classList.add("milestone");
  svg.appendChild(r);
}
