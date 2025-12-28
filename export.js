function exportPNG() {
  const el = document.getElementById("gantt-wrapper");

  html2canvas(el, {
    scale: 2,
    backgroundColor: "#ffffff"
  }).then(canvas => {
    const link = document.createElement("a");
    link.download = "gantt.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  });
}

function exportPDF() {
  const el = document.getElementById("gantt-wrapper");

  html2canvas(el, {
    scale: 2,
    backgroundColor: "#ffffff"
  }).then(canvas => {

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF("l", "pt", "a4");

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const imgWidth = canvas.width;
    const imgHeight = canvas.height;

    // 🔑 AUTO FIT SCALE
    const scale = Math.min(
      pageWidth / imgWidth,
      pageHeight / imgHeight
    );

    const renderWidth = imgWidth * scale;
    const renderHeight = imgHeight * scale;

    const xOffset = (pageWidth - renderWidth) / 2;
    const yOffset = (pageHeight - renderHeight) / 2;

    pdf.addImage(
      canvas.toDataURL("image/png"),
      "PNG",
      xOffset,
      yOffset,
      renderWidth,
      renderHeight
    );

    pdf.save("gantt-autofit.pdf");
  });
}
