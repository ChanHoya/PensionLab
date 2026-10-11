// 화면 영역을 캡처해 A4 세로 PDF로 내려받는다 (길면 여러 쪽으로 나눔, 브라우저 전용)
// data-html2canvas-ignore 속성이 있는 요소(버튼 등)는 캡처에서 빠진다
export async function downloadElementAsPdf(element: HTMLElement, fileName: string): Promise<void> {
  // 외부 CDN 대신 앱 번들에서 필요할 때만 불러온다
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import("html2canvas"), import("jspdf")]);

  // 대상 요소의 인라인 opacity가 0이면 html2canvas가 빈 화면(투명 캔버스)을 그리므로 일시적으로 1로 복구
  const prevOpacity = element.style.opacity;
  if (element.style.opacity === "0") {
    element.style.opacity = "1";
  }

  try {
    const bg = getComputedStyle(document.body).backgroundColor || "#ffffff";
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: bg, // 라이트·다크 테마 배경 그대로
      logging: false,
    });

    if (!canvas.width || !canvas.height) {
      throw new Error("캡처된 캔버스 크기가 0입니다.");
    }

    // PNG 대신 JPEG로 저장해 파일 크기를 줄인다
    const imgData = canvas.toDataURL("image/jpeg", 0.92);
    const pageWidth = 210;
    const pageHeight = 297;
    const imgHeight = (canvas.height * pageWidth) / canvas.width;
    const pdf = new jsPDF("p", "mm", "a4");
    for (let offset = 0; offset < imgHeight; offset += pageHeight) {
      if (offset > 0) pdf.addPage();
      pdf.addImage(imgData, "JPEG", 0, -offset, pageWidth, imgHeight);
    }
    pdf.save(fileName);
  } finally {
    if (prevOpacity === "0") {
      element.style.opacity = "0";
    }
  }
}
