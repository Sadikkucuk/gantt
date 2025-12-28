const svg = document.getElementById("gantt-svg");
const taskList = document.getElementById("task-list");

let currentZoom = "day";
const zoomPx = { day: 30, week: 10, month: 6 };

const rowHeight = 40;
const leftMargin = 10;
const topMargin = 30;

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

function renderGantt() {
  if (!window.tasks || window.tasks.length === 0) return;

  svg.innerHTML = "";
  taskList.innerHTML = "";

  const dates = window.tasks.flatMap(t => [new Date(t.start), new Date(t.end)]);
  const minDate = new Date(Math.min(...dates));
  const maxDate = new Date(Math.max(...dates));

  const dayWidth = zoomPx[currentZoom];
  const totalDays = Math.ceil((maxDate - minDate) / 86400000) + 1;

  svg.setAttribute("width", totalDays * dayWidth + 200);
  svg.setAttribute("height", window.tasks.length * rowHeight + topMargin);

  drawGrid(minDate, totalDays, dayWidth);
  drawTasks(minDate, dayWidth);
}

function drawGrid(minDate, totalDays, dayWidth) {
  for (let i = 0; i < totalDays; i++) {
    const x = i * dayWidth + 200;

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
    // left list
    const row = document.createElement("div");
    row.className = "task-row";
    row.style.paddingLeft = `${t.level * 14}px`;
    row.textContent = t.name;
    taskList.appendChild(row);

    const y = topMargin + i * rowHeight;

    const xStart =
      200 + ((new Date(t.start) - minDate) / 86400000) * dayWidth;
    const xEnd =
      200 + ((new Date(t.end) - minDate) / 86400000) * dayWidth;

    if (t.type === "milestone") {
      drawRect(xStart, y + 12, 12, 12, t.color || "#000", true);
    } else {
      drawRect(
        xStart,
        y + 10,
        Math.max(xEnd - xStart, 4),
        20,
        t.color || "#4caf50"
      );

      if (t.progress > 0) {
        drawRect(
          xStart,
          y + 10,
          (xEnd - xStart) * t.progress / 100,
          20,
          "rgba(0,0,0,0.25)"
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
