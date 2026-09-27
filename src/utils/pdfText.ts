// PDF 파일의 모든 페이지 텍스트를 이어 붙여 돌려준다 (브라우저 전용, pdfjs-dist 동적 로드)
export async function extractPdfText(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
  const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  let fullText = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    fullText += content.items.map((item) => ("str" in item ? item.str : "")).join(" ") + "\n";
  }
  return fullText.trim();
}
