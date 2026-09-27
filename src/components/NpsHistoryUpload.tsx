"use client";

import React, { useState } from "react";
import { usePensionStore, type Who } from "@/store/usePensionStore";
import { extractPdfText } from "@/utils/pdfText";
import { parseNpsHistoryText, deriveFromNpsHistory } from "@/services/npsHistoryParser";

// 국민연금공단 가입내역조회 화면 출력 PDF → 추납·반납 입력 자동 채움
export default function NpsHistoryUpload({ who }: { who: Who }) {
  const store = usePensionStore();
  const [status, setStatus] = useState<"idle" | "parsing" | "done" | "error">("idle");
  const [message, setMessage] = useState("");
  const [notes, setNotes] = useState<string[]>([]);

  const handleFile = async (file: File) => {
    setStatus("parsing");
    setMessage("");
    setNotes([]);
    try {
      const pdfText = await extractPdfText(file);
      const parsed = parseNpsHistoryText(pdfText);
      if (parsed.rows.length === 0 && parsed.totalMonths === null) {
        throw new Error("가입내역조회 화면을 출력한 PDF가 아닌 것 같습니다. 「조회 > 가입내역조회」 결과 화면을 인쇄 → PDF로 저장해 올려 주세요.");
      }
      const derived = deriveFromNpsHistory(parsed);
      store.setAdditionalPayment(derived.additionalPayment, who);
      if (Object.keys(derived.returnRepayment).length > 0) store.setReturnRepayment(derived.returnRepayment, who);
      if (Object.keys(derived.national).length > 0) store.setNationalPension(derived.national, who);
      setNotes(derived.notes);
      setStatus("done");
    } catch (e) {
      // 증명서 발급 PDF는 비밀번호로 암호화되어 pdfjs가 PasswordException을 던진다
      const encrypted = e instanceof Error && e.name === "PasswordException";
      setMessage(
        encrypted
          ? "암호화된 PDF(증명서 발급 파일)는 읽을 수 없습니다. 가입내역조회 화면을 인쇄 → PDF로 저장한 파일을 올려 주세요."
          : e instanceof Error ? e.message : "가입내역 분석에 실패했습니다."
      );
      setStatus("error");
    }
  };

  return (
    <div style={styles.box}>
      <div style={styles.title}>📄 국민연금 가입내역조회 PDF로 자동 입력</div>
      <p style={styles.desc}>
        국민연금공단 홈페이지 「조회 &gt; 가입내역조회」 결과 화면을 <strong>인쇄 → PDF로 저장</strong>해 올리면 국민연금 예상액·가입기간과 최초 가입년월·공백 기간·가입 상태·반환일시금
        내역을 채웁니다. 증명서 발급 PDF는 암호화되어 있어 읽을 수 없습니다. 채운 뒤 값을 꼭 확인하세요.
      </p>
      <input
        type="file"
        accept="application/pdf"
        disabled={status === "parsing"}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />
      {status === "parsing" && <p style={styles.desc}>⏳ 가입내역을 분석하는 중입니다…</p>}
      {status === "error" && <p style={styles.error}>⚠ {message}</p>}
      {status === "done" && (
        <div>
          <p style={styles.ok}>✅ 가입내역을 반영했습니다.</p>
          {notes.map((n) => (
            <p key={n} style={styles.desc}>• {n}</p>
          ))}
        </div>
      )}
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  box: {
    border: "1px dashed rgba(99, 102, 241, 0.4)",
    borderRadius: "var(--radius-sm)",
    padding: "14px 16px",
    backgroundColor: "rgba(99, 102, 241, 0.04)",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  title: { fontSize: "0.9rem", fontWeight: 700, color: "var(--primary)" },
  desc: { fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: 1.5, margin: 0 },
  error: { fontSize: "0.8rem", color: "var(--danger, #ef4444)", margin: 0 },
  ok: { fontSize: "0.85rem", color: "var(--success-light, #10b981)", fontWeight: 600, margin: 0 },
};
