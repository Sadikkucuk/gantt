const svg = document.getElementById("gantt-svg");
const taskList = document.getElementById("task-list");

let currentZoom = "day";
const zoomPx = { day: 30, week: 10, month: 3 };

const rowHeight = 40;
const leftMargin = 200;
const topMargin = 40;

document.getElementById("csvInput").addEventListener("change", e => {
  const r = new FileReader();
  r.onload = () => {
    window.tasks = parseCSV(r.result);
    renderGantt();
  };
  r.readAsText(e.target.files[0]);
});

function setZoom(z) {
  currentZoom = z;
  renderGantt();
}

function renderGantt() {
  if (!window.tasks) return;
  svg.innerHTML = "";
  taskList.innerHTML = "";

  const dates = window.tasks.flatMap(t => [new Date(t.start), new Date(t.end)]);
  const min = new Date(Math.min(...dates));
  const max = new Date(Math.max(...dates));

  const days = Math.ceil((max - min) / 86400000) + 1;
  const dayWidth = zoomPx[currentZoom];

  svg.setAttribute("width", leftMargin + days * dayWidth);
  svg.setAttribute("height", topMargin + window.tasks.length * rowHeight);

  defineArrow();

  window.tasks.forEach((t, i) => {
    const row = document.createElement("div");
    row.className = "task-row";
    row.style.paddingLeft = `${t.level * 12}px`;
    row.textContent = t.name;
    taskList.appendChild(row);

    const y = topMargin + i * rowHeight;
    const x1 = leftMargin + ((new Date(t.start) - min) / 86400000) * dayWidth;
    const x2 = leftMargin + ((new Date(t.end) - min) / 86400000) * dayWidth;

    if (t.type === "milestone") {
      drawRect(x1, y + 12, 12, 12, t.color || "#000", true);
    } else {
      drawRect(x1, y + 10, x2 - x1, 20, t.color || "#4caf50");
      if (t.progress) {
        drawRect(x1, y + 10, (x2 - x1) * t.progress / 100, 20, "rgba(0,0,0,0.2)");
      }
    }
  });
}

function drawRect(x, y, w, h, c, milestone) {
  const r = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  r.setAttribute("x", x);
  r.setAttribute("y", y);
  r.setAttribute("width", w);
  r.setAttribute("height", h);
  r.setAttribute("fill", c);
  if (milestone) r.classList.add("milestone");
  svg.appendChild(r);
}

function defineArrow() {
  const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
  const m = document.createElementNS("http://www.w3.org/2000/svg", "marker");
  m.setAttribute("id", "arrow");
  m.setAttribute("markerWidth", 10);
  m.setAttribute("markerHeight", 10);
  m.setAttribute("refX", 10);
  m.setAttribute("refY", 3);
  m.setAttribute("orient", "auto");

  const p = document.createElementNS("http://www.w3.org/2000/svg", "path");
  p.setAttribute("d", "M0,0 L0,6 L9,3 z");
  p.setAttribute("fill", "#555");

  m.appendChild(p);
  defs.appendChild(m);
  svg.appendChild(defs);
}
