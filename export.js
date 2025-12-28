function exportPNG() {
  html2canvas(document.getElementById("gantt-wrapper")).then(canvas => {
    const a = document.createElement("a");
    a.download = "gantt.png";
    a.href = canvas.toDataURL();
    a.click();
  });
}

function exportPDF() {
  html2canvas(document.getElementById("gantt-wrapper")).then(canvas => {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF("l", "px", [canvas.width, canvas.height]);
    pdf.addImage(canvas, "PNG", 0, 0);
    pdf.save("gantt.pdf");
  });
}
