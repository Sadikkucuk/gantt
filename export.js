function exportPNG() {
  html2canvas(document.getElementById("gantt-wrapper"), { scale: 2 })
    .then(c => {
      const a = document.createElement("a");
      a.href = c.toDataURL();
      a.download = "gantt.png";
      a.click();
    });
}

function exportPDF() {
  html2canvas(document.getElementById("gantt-wrapper"), { scale: 2 })
    .then(c => {
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF("l", "pt", "a4");

      const pw = pdf.internal.pageSize.getWidth();
      const ph = pdf.internal.pageSize.getHeight();
      const scale = Math.min(pw / c.width, ph / c.height);

      pdf.addImage(
        c.toDataURL(),
        "PNG",
        (pw - c.width * scale) / 2,
        (ph - c.height * scale) / 2,
        c.width * scale,
        c.height * scale
      );

      pdf.save("gantt-autofit.pdf");
    });
}
