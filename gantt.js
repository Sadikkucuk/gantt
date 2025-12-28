console.log("gantt.js loaded v12");

const svg = document.getElementById("gantt-svg");
const taskList = document.getElementById("task-list");

// IMPORTANT: var -> export.js erişimi stabil olsun
var currentZoom = "day";
const zoomPx = { day: 30, week: 12, month: 6 };

// Export sırasında küçültme presetleri
const layoutPresets = [
  { rowH: 40, barH: 20, font: 12, left: 220, dayScale: 1.00 }, // normal
  { rowH: 32, barH: 16, font: 11, left: 205, dayScale: 0.85 }, // compact1
  { rowH: 28, barH: 14, font: 10, left: 190, dayScale: 0.75 }, // compact2
  { rowH: 24, barH: 12, font:  9, left: 175, dayScale: 0.65 }  // compact3
];
var currentPresetIndex = 0;

// 5 level sabit renk
const levelColors = ["#2E7D32", "#1565C0", "#C62828", "#EF6C00", "#6A1B9A"];

function adjustColor(hex, delta) {
  const num = parseInt(hex.replace("#",""), 16);
  let r = (num >> 16) + delta;
  let g = ((num >> 8) & 255) + delta;
  let b = (num & 255) + delta;
  r = Math.max(0, Math.min(255, r));
  g = Math.max(0, Math.min(255, g));
  b = Math.max(0, Math.min(255, b));
  return `rgb(${r},${g},${b})`;
}

function applyPreset(idx) {
  currentPresetIndex = Math.max(0, Math.min(layoutPresets.length - 1, idx));
  const p = layoutPresets[currentPresetIndex];
  document.documentElement.style.setProperty("--row-height", `${p.rowH}px`);
  document.documentElement.style.setProperty("--task-font-size", `${p.font}px`);
}

document.getElementById("csvInput").addEventListener("change", e => {
  const reader = new FileReader();
  reader.onload = () => {
    window.tasks = parseCSV(reader.result);
    applyPreset(0);
    renderGantt();
  };
  reader.readAsText(e.target.files[0]);
});

function setZoom(z) {
  currentZoom = z;
  if (window.tasks) renderGantt();
}

function renderGantt() {
  if (!window.tasks || window.tasks.length === 0) return;

  const p = layoutPresets[currentPresetIndex];
  const rowHeight = p.rowH;
  const barHeight = p.barH;
  const leftOffset = p.left;

  // headers: quarter + date
  const quarterH = 18;
  const dateH = 16;
  const topMargin = quarterH + dateH + 10;

  svg.innerHTML = "";
  taskList.innerHTML = "";

  const dates = window.tasks.flatMap(t => [new Date(t.start), new Date(t.end)]);
  const minDate = new Date(Math.min(...dates));
  const maxDate = new Date(Math.max(...dates));

  const dayWidth = zoomPx[currentZoom] * p.dayScale;
  const totalDays = Math.max(1, Math.ceil((maxDate - minDate) / 86400000) + 1);

  svg.setAttribute("width", leftOffset + totalDays * dayWidth);
  svg.setAttribute("height", topMargin + window.tasks.length * rowHeight);

  drawQuarterHeader(minDate, maxDate, dayWidth, leftOffset, quarterH);
  drawDateHeader(minDate, totalDays, dayWidth, leftOffset, quarterH);
  drawGrid(totalDays, dayWidth, leftOffset, topMargin);
  drawTasks(minDate, dayWidth, leftOffset, topMargin, rowHeight, barHeight);
}

function drawQuarterHeader(minDate, maxDate, dayWidth, leftOffset, quarterH) {
  // Quarter start helper
  const qStartMonth = m => Math.floor(m / 3) * 3;

  let cur = new Date(minDate.getFullYear(), qStartMonth(minDate.getMonth()), 1);
  const end = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);

  while (cur <= end) {
    const q = Math.floor(cur.getMonth() / 3) + 1;
    const segStart = new Date(cur);
    const segEnd = new Date(cur.getFullYear(), cur.getMonth() + 3, 1);

    const clipStart = segStart < minDate ? new Date(minDate) : segStart;
    const clipEnd = segEnd > maxDate ? new Date(maxDate.getTime() + 86400000) : segEnd;

    const x1 = leftOffset + ((clipStart - minDate) / 86400000) * dayWidth;
    const x2 = leftOffset + ((clipEnd - minDate) / 86400000) * dayWidth;

    const band = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    band.setAttribute("x", x1);
    band.setAttribute("y", 0);
    band.setAttribute("width", Math.max(0, x2 - x1));
    band.setAttribute("height", quarterH);
    band.setAttribute("fill", (q % 2 === 0) ? "#f3f3f3" : "#ffffff");
    svg.appendChild(band);

    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.textContent = `${segStart.getFullYear()} Q${q}`;
    label.setAttribute("x", x1 + 6);
    label.setAttribute("y", 13);
    label.setAttribute("font-size", "10");
    label.setAttribute("fill", "#333");
    svg.appendChild(label);

    cur = segEnd;
  }

  const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
  line.setAttribute("x1", leftOffset);
  line.setAttribute("y1", quarterH);
  line.setAttribute("x2", svg.getAttribute("width"));
  line.setAttribute("y2", quarterH);
  line.setAttribute("stroke", "#ddd");
  svg.appendChild(line);
}

function drawDateHeader(minDate, totalDays, dayWidth, leftOffset, quarterH) {
  const y = quarterH + 12;

  for (let i = 0; i < totalDays; i++) {
    const d = new Date(minDate);
    d.setDate(d.getDate() + i);

    const show =
      (currentZoom === "day" && (dayWidth >= 18 ? true : d.getDay() === 1)) ||
      (currentZoom === "week" && d.getDay() === 1) ||
      (currentZoom === "month" && d.getDate() === 1);

    if (!show) continue;

    const x = leftOffset + i * dayWidth + 2;
    const t = document.createElementNS("http://www.w3.org/2000/svg", "text");

    if (currentZoom === "day") t.textContent = `${d.getMonth()+1}/${d.getDate()}`;
    if (currentZoom === "week") t.textContent = `Wk ${getWeekNumber(d)}`;
    if (currentZoom === "month") t.textContent = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;

    t.setAttribute("x", x);
    t.setAttribute("y", y);
    t.setAttribute("font-size", "10");
    t.setAttribute("fill", "#333");
    svg.appendChild(t);
  }

  const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
  line.setAttribute("x1", leftOffset);
  line.setAttribute("y1", quarterH + 16);
  line.setAttribute("x2", svg.getAttribute("width"));
  line.setAttribute("y2", quarterH + 16);
  line.setAttribute("stroke", "#ddd");
  svg.appendChild(line);
}

function getWeekNumber(d) {
  d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const dayNum = Math.floor((d - yearStart) / 86400000) + 1;
  return Math.ceil((dayNum + yearStart.getUTCDay()) / 7);
}

function drawGrid(totalDays, dayWidth, leftOffset, topMargin) {
  const height = parseFloat(svg.getAttribute("height"));

  for (let i = 0; i < totalDays; i++) {
    const x = leftOffset + i * dayWidth;
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", x);
    line.setAttribute("y1", 0);
    line.setAttribute("x2", x);
    line.setAttribute("y2", height);
    line.setAttribute("stroke", "#eee");
    svg.appendChild(line);
  }

  const hline = document.createElementNS("http://www.w3.org/2000/svg", "line");
  hline.setAttribute("x1", leftOffset);
  hline.setAttribute("y1", topMargin);
  hline.setAttribute("x2", svg.getAttribute("width"));
  hline.setAttribute("y2", topMargin);
  hline.setAttribute("stroke", "#eee");
  svg.appendChild(hline);
}

function drawTasks(minDate, dayWidth, leftOffset, topMargin, rowHeight, barHeight) {
  const milestoneSize = Math.max(10, barHeight);

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
    const remainingColor = adjustColor(base, +70); // light
    const completedColor = adjustColor(base, -30); // dark

    if (t.type === "milestone") {
      drawRect(
        xStart,
        y + Math.floor((rowHeight - milestoneSize) / 2),
        milestoneSize,
        milestoneSize,
        completedColor,
        true
      );
    } else {
      const w = Math.max(6, xEnd - xStart);
      const barY = y + Math.floor((rowHeight - barHeight) / 2);

      drawRect(xStart, barY, w, barHeight, remainingColor);
      if (t.progress > 0) drawRect(xStart, barY, w * t.progress / 100, barHeight, completedColor);
    }
  });
}

function drawRect(x, y, w, h, color, milestone = false) {
  const r = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  r.setAttribute("x", x);
  r.setAttribute("y", y);
  r.setAttribute("width", Math.max(0, w));
  r.setAttribute("height", Math.max(0, h));
  r.setAttribute("fill", color);
  if (milestone) r.classList.add("milestone");
  svg.appendChild(r);
}
