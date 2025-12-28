console.log("export.js loaded v13");

function exportPNG() {
  const el = document.getElementById("gantt-wrapper");
  html2canvas(el, { scale: 2, backgroundColor: "#ffffff" }).then(c => {
    const a = document.createElement("a");
    a.href = c.toDataURL("image/png");
    a.download = "gantt.png";
    a.click();
  });
}

// PDF: full task list + full timeline (no cropping) + auto-fit
async function exportPDF() {
  if (!window.tasks || window.tasks.length === 0) return;

  const taskListEl = document.getElementById("task-list");
  const timelineEl = document.getElementById("timeline");
  const wrapperEl = document.getElementById("gantt-wrapper");
  const svgEl = document.getElementById("gantt-svg");

  // Save current UI state
  const savedZoom = currentZoom;
  const savedPreset = currentPresetIndex;
  const savedScrollLeft = timelineEl.scrollLeft;
  const savedScrollTop = timelineEl.scrollTop;

  // Helper: choose compact settings for export (fonts/bars smaller)
  const chooseExportLayout = async () => {
    // Try progressively more compact; if still too wide, switch zoom to month
    const candidates = [
      { zoom: currentZoom, preset: 2 },
      { zoom: currentZoom, preset: 3 },
      { zoom: "week", preset: 3 },
      { zoom: "month", preset: 3 }
    ];

    const measure = () => {
      // IMPORTANT: scrollWidth gives FULL content width even if overflowed
      const taskW = taskListEl.scrollWidth;
      const timeW = timelineEl.scrollWidth;
      const fullW = Math.ceil(taskW + timeW);

      const fullH = Math.ceil(
        Math.max(taskListEl.scrollHeight, timelineEl.scrollHeight, svgEl.getBoundingClientRect().height)
      );

      return { taskW, timeW, fullW, fullH };
    };

    for (const c of candidates) {
      currentZoom = c.zoom;
      applyPreset(c.preset);
      renderGantt();
      await new Promise(r => setTimeout(r, 80));

      const m = measure();
      // canvas size çok büyürse html2canvas bazen sadece sol tarafı yakalar.
      // Bu yüzden makul bir üst limit hedefliyoruz.
      if (m.fullW <= 6500 && m.fullH <= 6500) return m;
    }

    // None fit under threshold; return the last measure anyway
    return measure();
  };

  // Build an off-screen export container that contains FULL content (no scroll clipping)
  const buildExportNode = (m) => {
    const exportNode = document.createElement("div");
    exportNode.style.position = "fixed";
    exportNode.style.left = "-100000px";
    exportNode.style.top = "0";
    exportNode.style.background = "#ffffff";
    exportNode.style.display = "flex";
    exportNode.style.flexDirection = "row";
    exportNode.style.width = `${m.fullW}px`;
    exportNode.style.height = `${m.fullH}px`;
    exportNode.style.overflow = "visible";

    const taskClone = taskListEl.cloneNode(true);
    taskClone.style.overflow = "visible";
    taskClone.style.width = `${m.taskW}px`;
    taskClone.style.height = `${m.fullH}px`;
    taskClone.style.flex = "0 0 auto";

    const timeClone = timelineEl.cloneNode(true);
    timeClone.style.overflow = "visible";
    timeClone.style.width = `${m.timeW}px`;
    timeClone.style.height = `${m.fullH}px`;
    timeClone.style.flex = "0 0 auto";
    timeClone.scrollLeft = 0;
    timeClone.scrollTop = 0;

    // Ensure cloned SVG keeps explicit width/height so html2canvas paints it
    const clonedSvg = timeClone.querySelector("#gantt-svg");
    if (clonedSvg) {
      const wAttr = svgEl.getAttribute("width");
      const hAttr = svgEl.getAttribute("height");
      if (wAttr) clonedSvg.setAttribute("width", wAttr);
      if (hAttr) clonedSvg.setAttribute("height", hAttr);
      clonedSvg.style.display = "block";
    }

    exportNode.appendChild(taskClone);
    exportNode.appendChild(timeClone);

    return exportNode;
  };

  try {
    // Export için kompaktlaştır + ölç
    const m = await chooseExportLayout();

    // Scrollları sıfırla (ölçüm/tutarlılık için)
    timelineEl.scrollLeft = 0;
    timelineEl.scrollTop = 0;

    // Off-screen export node
    const exportNode = buildExportNode(m);
    document.body.appendChild(exportNode);

    // Render to canvas (full width/height)
    const canvas = await html2canvas(exportNode, {
      scale: 2,
      backgroundColor: "#ffffff",
      width: m.fullW,
      height: m.fullH,
      windowWidth: m.fullW,
      windowHeight: m.fullH,
      scrollX: 0,
      scrollY: 0,
      useCORS: true
    });

    document.body.removeChild(exportNode);

    // PDF auto-fit (A4 landscape)
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF("l", "pt", "a4");

    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();

    const s = Math.min(pageW / canvas.width, pageH / canvas.height);
    const w = canvas.width * s;
    const h = canvas.height * s;

    pdf.addImage(
      canvas.toDataURL("image/png"),
      "PNG",
      (pageW - w) / 2,
      (pageH - h) / 2,
      w,
      h
    );

    pdf.save("gantt-autofit.pdf");
  } finally {
    // Restore original UI state
    currentZoom = savedZoom;
    applyPreset(savedPreset);
    renderGantt();
    timelineEl.scrollLeft = savedScrollLeft;
    timelineEl.scrollTop = savedScrollTop;
  }
}
