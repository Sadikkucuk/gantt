function exportPDF() {
  const container = document.getElementById("gantt-wrapper");

  html2canvas(container, {
    scale: 2,
    useCORS: true
  }).then(canvas => {
    const { jsPDF } = window.jspdf;

    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("l", "pt", "a4");

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const imgWidth = canvas.width;
    const imgHeight = canvas.height;

    // AUTO FIT SCALE
    const scale = Math.min(
      pageWidth / imgWidth,
      pageHeight / imgHeight
    );

    const renderWidth = imgWidth * scale;
    const renderHeight = imgHeight * scale;

    const xOffset = (pageWidth - renderWidth) / 2;
    const yOffset = (pageHeight - renderHeight) / 2;

    pdf.addImage(
      imgData,
      "PNG",
      xOffset,
      yOffset,
      renderWidth,
      renderHeight
    );

    pdf.save("gantt-autofit.pdf");
  });
}
