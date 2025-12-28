// ===== COLOR SYSTEM (FINAL) =====
const levelColors = [
  "#2E7D32", // green
  "#1565C0", // blue
  "#C62828", // red
  "#EF6C00", // orange
  "#6A1B9A"  // purple
];

function adjustColor(hex, delta) {
  const num = parseInt(hex.replace("#", ""), 16);
  let r = (num >> 16) + delta;
  let g = ((num >> 8) & 0xff) + delta;
  let b = (num & 0xff) + delta;

  r = Math.max(0, Math.min(255, r));
  g = Math.max(0, Math.min(255, g));
  b = Math.max(0, Math.min(255, b));

  return `rgb(${r}, ${g}, ${b})`;
}

const svg = document.getElementById("gantt-svg");
const taskList = document.getElementById("task-list");

let currentZoom = "day";
const zoomPx = { day: 30, week: 12, month: 6 };

const rowHeight = 40;
const leftOffset = 200;
const topMargin = 30;

// 5-level fixed color palette
const levelColors = [
  "#2E7D32", // green
  "#1565C0", // blue
  "#C62828", // red
  "#EF6C00", // orange
  "#6A1B9A"  // purple
];

document.getElementById("csvInput").addEventListener("change", e => {
  const reader = new FileReader();
  reader.onload = () => {
    window.tasks = parseCSV(reader.result);
    renderGantt();
  };
  reader.readAsText(e.target.files[0]);
});

function setZoom(z) {
  currentZoom = z;
  renderGantt();
}

function adjustColor(hex, delta) {
  let num = parseInt(hex.slice(1), 16);
  let r = Math.min(255, Math.max(0, (num >> 16) + delta));
  let g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + delta));
  let b = Math.min(255, Math.max(0, (num & 0xff) + delta));
  return `rgb(${r},${g},${b})`;
}

function renderGantt() {
  if (!window.tasks) return;

  svg.innerHTML = "";
  taskList.innerHTML = "";

  const dates = window.tasks.flatMap(t => [new Date(t.start), new Date(t.end)]);
  const minDate = new Date(Math.min(...dates));
  const maxDate = new Date(Math.max(...dates));

  const dayWidth = zoomPx[currentZoom];
  const totalDays = Math.ceil((maxDate - minDate) / 86400000) + 1;

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

    const d = new Date(minDate);
    d.setDate(d.getDate() + i);

    if (currentZoom === "day" || d.getDate() === 1) {
      const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
      label.textContent = `${d.getMonth() + 1}/${d.getDate()}`;
      label.setAttribute("x", x + 2);
      label.setAttribute("y", 15);
      label.setAttribute("font-size", "10");
      svg.appendChild(label);
    }
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

    const baseColor = levelColors[(t.level - 1) % levelColors.length];
    const remainingColor = adjustColor(baseColor, 70);
    const completedColor = adjustColor(baseColor, -20);

    if (t.type === "milestone") {
      drawRect(xStart, y + 12, 12, 12, completedColor, true);
    } else {
      drawRect(xStart, y + 10, Math.max(xEnd - xStart, 4), 20, remainingColor);
      if (t.progress > 0) {
        drawRect(
          xStart,
          y + 10,
          (xEnd - xStart) * t.progress / 100,
          20,
          completedColor
        );
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
