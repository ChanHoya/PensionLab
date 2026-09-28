// PDF 파일의 모든 페이지 텍스트를 이어 붙여 돌려준다 (브라우저 전용, pdfjs-dist 동적 로드)
export async function extractPdfText(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  // 해석기(worker)는 외부 CDN 대신 앱에 포함된 파일을 쓴다. npm install 때 pdfjs-dist 버전에 맞춰 public/으로 복사됨
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  let fullText = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    fullText += content.items.map((item) => ("str" in item ? item.str : "")).join(" ") + "\n";
  }
  return fullText.trim();
}
