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

  const el = document.getElementById("gantt-wrapper");
  const { jsPDF } = window.jspdf;

  // save state
  const savedZoom = window.currentZoom || "day"; // fallback
  const savedPresetIndex = window.currentPresetIndex ?? 0;

  // Helper: compute how well it fits A4 landscape
  const fitScore = () => {
    // wrapper's full content size (not visible viewport)
    const w = el.scrollWidth;
    const h = el.scrollHeight;
    // A4 landscape in px-equivalent is not fixed; we use ratio only
    // We'll target scale >= 0.60 (readability)
    const pageW = 842; // pt reference
    const pageH = 595; // pt reference
    const s = Math.min(pageW / w, pageH / h);
    return { scale: s, w, h };
  };

  // We try to raise fit scale by compacting the render
  // Strategy:
  // 1) Increase compactness
  // 2) If still small, switch zoom to month while exporting
  const ensureFit = async () => {
    let best = fitScore();

    // Try presets progressively
    for (let p = 0; p <= 3; p++) {
      applyPreset(p);
      renderGantt();
      await new Promise(r => setTimeout(r, 50));
      best = fitScore();
      if (best.scale >= 0.60) return { usedPreset: p, usedZoom: currentZoom, best };
    }

    // Still too large -> switch zoom to month for export
    const beforeZoom = currentZoom;
    setZoom("month");
    await new Promise(r => setTimeout(r, 80));

    // Try presets again in month zoom
    for (let p = 0; p <= 3; p++) {
      applyPreset(p);
      renderGantt();
      await new Promise(r => setTimeout(r, 50));
      best = fitScore();
      if (best.scale >= 0.60) return { usedPreset: p, usedZoom: "month", best };
    }

    return { usedPreset: 3, usedZoom: "month", best };
  };

  let used;
  try {
    used = await ensureFit();

    const canvas = await html2canvas(el, { scale: 2, backgroundColor: "#ffffff" });
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
    // restore state
    currentZoom = savedZoom;
    applyPreset(savedPresetIndex);
    renderGantt();
  }
}
