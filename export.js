function exportPNG() {
  html2canvas(document.getElementById("gantt-wrapper"), { scale: 2 })
    .then(canvas => {
      const a = document.createElement("a");
      a.download = "gantt.png";
      a.href = canvas.toDataURL();
      a.click();
    });
}

function exportPDF() {
  const container = document.getElementById("gantt-wrapper");

  html2canvas(container, { scale: 2 }).then(canvas => {
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
  });
}
