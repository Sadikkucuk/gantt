console.log("export.js loaded v12");

function exportPNG() {
  const el = document.getElementById("gantt-wrapper");
  html2canvas(el, { scale: 2, backgroundColor: "#ffffff" }).then(c => {
    const a = document.createElement("a");
    a.href = c.toDataURL("image/png");
    a.download = "gantt.png";
    a.click();
  });
}

async function exportPDF() {
  if (!window.tasks || window.tasks.length === 0) return;

  const wrapper = document.getElementById("gantt-wrapper");
  const taskListEl = document.getElementById("task-list");
  const svgEl = document.getElementById("gantt-svg");
  const timelineEl = document.getElementById("timeline");

  // Save current view
  const savedZoom = currentZoom;
  const savedPreset = currentPresetIndex;
  const savedScrollLeft = timelineEl.scrollLeft;
  const savedScrollTop = timelineEl.scrollTop;

  try {
    // --- Export için geçici küçültme (font / bar / row) ---
    // PDF için genelde compact2 iyi çalışır; çok büyük chart'ta compact3 + month
    applyPreset(2);
    renderGantt();

    // Eğer hala çok genişse, export sırasında month'a düş
    const fullSvgW = parseFloat(svgEl.getAttribute("width")) || 0;
    if (fullSvgW > 8000) {
      currentZoom = "month";
      applyPreset(3);
      renderGantt();
    }

    // Scroll'ları 0'a çek (clone'a temiz basmak için)
    timelineEl.scrollLeft = 0;
    timelineEl.scrollTop = 0;

    // Full dimensions (px)
    const taskW = taskListEl.getBoundingClientRect().width;
    const svgW = parseFloat(svgEl.getAttribute("width")) || svgEl.getBBox().width;
    const svgH = parseFloat(svgEl.getAttribute("height")) || svgEl.getBBox().height;

    const fullW = Math.ceil(taskW + svgW);
    const fullH = Math.ceil(Math.max(taskListEl.scrollHeight, svgH));

    // --- Off-screen clone: overflow kırpılmasın ---
    const clone = wrapper.cloneNode(true);
    clone.style.position = "fixed";
    clone.style.left = "-100000px";
    clone.style.top = "0";
    clone.style.width = fullW + "px";
    clone.style.height = fullH + "px";
    clone.style.overflow = "visible";
    clone.style.background = "#ffffff";
    clone.id = "gantt-export-clone";

    const cloneTaskList = clone.querySelector("#task-list");
    const cloneTimeline = clone.querySelector("#timeline");
    const cloneSvg = clone.querySelector("#gantt-svg");

    cloneTaskList.style.overflow = "visible";
    cloneTaskList.style.height = fullH + "px";
    cloneTimeline.style.overflow = "visible";
    cloneTimeline.style.height = fullH + "px";
    cloneTimeline.style.width = (fullW - taskW) + "px";

    cloneSvg.setAttribute("width", svgW);
    cloneSvg.setAttribute("height", svgH);

    document.body.appendChild(clone);

    // Canvas capture (full area)
    const canvas = await html2canvas(clone, {
      scale: 2,
      backgroundColor: "#ffffff",
      width: fullW,
      height: fullH,
      windowWidth: fullW,
      windowHeight: fullH,
      scrollX: 0,
      scrollY: 0
    });

    document.body.removeChild(clone);

    // --- PDF Autofit ---
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF("l", "pt", "a4");

    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();

    const scale = Math.min(pageW / canvas.width, pageH / canvas.height);
    const w = canvas.width * scale;
    const h = canvas.height * scale;

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
    // Restore
    currentZoom = savedZoom;
    applyPreset(savedPreset);
    renderGantt();
    timelineEl.scrollLeft = savedScrollLeft;
    timelineEl.scrollTop = savedScrollTop;
  }
}
