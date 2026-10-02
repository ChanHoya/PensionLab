"use client";

import React, { useState } from "react";
import type { Who } from "@/store/usePensionStore";

export type FssSlot = "SUMMARY" | "NATIONAL" | "RETIREMENT" | "PERSONAL";
export type FssFiles = Record<FssSlot, File[]>;

// 통합연금포털에서 항목별로 PDF 출력한 문서. 퇴직·개인연금은 계약마다 따로 출력되므로 여러 개 등록
export const FSS_SLOTS: { key: FssSlot; label: string; multiple: boolean }[] = [
  { key: "SUMMARY", label: "1. 전체 연금계약정보", multiple: false },
  { key: "NATIONAL", label: "2. 국민연금 계약상세", multiple: false },
  { key: "RETIREMENT", label: "3. 퇴직연금 계약상세", multiple: true },
  { key: "PERSONAL", label: "4. 개인연금 계약상세", multiple: true },
];

export const emptyFssFiles = (): FssFiles => ({ SUMMARY: [], NATIONAL: [], RETIREMENT: [], PERSONAL: [] });

interface Props {
  hasSpouse: boolean;
  files: Record<Who, FssFiles>;
  onChange: (who: Who, slot: FssSlot, files: File[]) => void;
  analyzing: boolean;
  error: string;
  onOpenPersonaModal?: () => void;
}

// 금감원 통합연금포털 PDF 업로드 (항목별). 분석은 부모의 「다음 단계」에서 한 번에 한다
export default function FssUploadPanel({ hasSpouse, files, onChange, analyzing, error, onOpenPersonaModal }: Props) {
  const [who, setWho] = useState<Who>("SELF");
  const current = files[who];

  return (
    <div style={styles.wrap} className="animate-fade-in">
      <div style={styles.infoAlert}>
        📄 <strong>금융감독원 통합연금포털 PDF 등록</strong>
        <p style={styles.alertText}>
          통합연금포털의 항목별 화면을 PDF로 출력해 아래 칸에 등록한 뒤 「다음 단계」를 누르면, AI가 읽어 1층(국민연금)·2층(퇴직연금)·3층(개인연금)의
          「입력결과」에 채웁니다. 채워진 값은 각 단계에서 직접 고칠 수 있습니다.
        </p>
        <p style={styles.alertText}>
          ℹ️ 통합연금포털은 <strong>회원가입(본인인증) 후</strong> 이용할 수 있습니다. 가입 후 처음 연금정보를 조회하면 국민연금공단·금융회사에서
          정보를 모으는 데 <strong>일정 기간이 걸려</strong> 바로 PDF를 받을 수 없으니, 미리 가입하고 조회를 신청해 두세요.
        </p>
        <p style={{ ...styles.alertText, color: "#818cf8" }}>
          💡 본인 자료 조회 가능 전까지{" "}
          <span
            onClick={onOpenPersonaModal}
            style={{
              color: "#c4b5fd",
              fontWeight: 700,
              textDecoration: "underline",
              cursor: onOpenPersonaModal ? "pointer" : "default",
            }}
          >
            오른쪽 페르소나 체험하기
          </span>
          를 통해 서비스를 사용해보세요.
        </p>
        <p style={{ ...styles.alertText, color: "var(--warning)" }}>
          ⚠️ 다운로드 시 설정된 PDF 비밀번호(보통 생년월일 6자리 또는 설정한 비밀번호)를 반드시 해제(인쇄용 PDF 저장 등으로 무암호화)한 후 업로드해주셔야
          자동 파싱이 가능합니다.
        </p>
      </div>

      <div style={styles.portal}>
        <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary)" }}>금융감독원 통합연금포털 바로가기</span>
        <a href="https://100lifeplan.fss.or.kr" target="_blank" rel="noopener noreferrer" style={styles.portalLink}>
          100lifeplan.fss.or.kr
        </a>
      </div>

      {hasSpouse && (
        <div style={styles.whoTabs}>
          {(["SELF", "SPOUSE"] as Who[]).map((w) => {
            const count = FSS_SLOTS.reduce((n, s) => n + files[w][s.key].length, 0);
            return (
              <button
                key={w}
                type="button"
                onClick={() => setWho(w)}
                style={{ ...styles.whoTab, ...(w === who ? styles.whoTabActive : null) }}
              >
                {w === "SELF" ? "본인" : "배우자"} 자료{count > 0 ? ` (${count})` : ""}
              </button>
            );
          })}
        </div>
      )}

      <div style={styles.slotList}>
        {FSS_SLOTS.map((slot) => {
          const inputId = `fss-file-${who}-${slot.key}`;
          const list = current[slot.key];
          return (
            <div key={slot.key} style={styles.slot}>
              <div style={styles.slotHead}>
                <span style={styles.slotLabel}>
                  {slot.label}
                  {slot.multiple && <span style={styles.slotHint}> (계약별로 여러 개 등록 가능)</span>}
                </span>
                <input
                  id={inputId}
                  type="file"
                  accept=".pdf"
                  multiple={slot.multiple}
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const picked = Array.from(e.target.files ?? []);
                    if (picked.length) onChange(who, slot.key, slot.multiple ? [...list, ...picked] : picked.slice(0, 1));
                    e.target.value = "";
                  }}
                />
                <button
                  type="button"
                  className="premium-button-secondary"
                  style={styles.pickBtn}
                  disabled={analyzing}
                  onClick={() => document.getElementById(inputId)?.click()}
                >
                  {slot.multiple && list.length ? "+ PDF 추가" : list.length ? "PDF 변경" : "PDF 선택"}
                </button>
              </div>
              {list.length > 0 ? (
                <div style={styles.fileList}>
                  {list.map((f, i) => (
                    <span key={`${f.name}-${i}`} style={styles.fileChip}>
                      📎 {f.name}
                      <button
                        type="button"
                        aria-label={`${f.name} 삭제`}
                        disabled={analyzing}
                        onClick={() => onChange(who, slot.key, list.filter((_, j) => j !== i))}
                        style={styles.removeBtn}
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <span style={styles.empty}>등록된 파일 없음</span>
              )}
            </div>
          );
        })}
      </div>

      {analyzing && (
        <div style={styles.status}>
          <div style={styles.spinner} />
          등록한 PDF를 읽어 AI로 분석하는 중입니다...
        </div>
      )}
      {error && <div style={styles.error}>⚠️ {error}</div>}
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  wrap: { display: "flex", flexDirection: "column", gap: "16px" },
  infoAlert: {
    backgroundColor: "rgba(99, 102, 241, 0.07)",
    border: "1px solid rgba(99, 102, 241, 0.18)",
    borderLeft: "3px solid rgba(99, 102, 241, 0.6)",
    borderRadius: "var(--radius-sm)",
    padding: "12px 16px",
    fontSize: "0.9rem",
    color: "var(--text-primary)",
  },
  alertText: { fontSize: "0.85rem", marginTop: 4, color: "var(--text-secondary)", lineHeight: 1.5 },
  portal: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "8px",
    padding: "14px 18px",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-sm)",
    backgroundColor: "var(--background)",
  },
  portalLink: { color: "var(--primary-light)", fontWeight: 700, textDecoration: "underline", fontSize: "0.9rem" },
  whoTabs: { display: "flex", gap: "8px" },
  whoTab: {
    padding: "8px 18px",
    borderRadius: "999px",
    border: "1px solid var(--border)",
    backgroundColor: "transparent",
    color: "var(--text-secondary)",
    fontWeight: 600,
    fontSize: "0.9rem",
    cursor: "pointer",
  },
  whoTabActive: { background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#ffffff", borderColor: "transparent" },
  slotList: { display: "flex", flexDirection: "column", gap: "10px" },
  slot: {
    border: "1px dashed rgba(99, 102, 241, 0.35)",
    borderRadius: "var(--radius-sm)",
    padding: "12px 16px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  slotHead: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", flexWrap: "wrap" },
  slotLabel: { fontSize: "0.92rem", fontWeight: 700, color: "var(--text-primary)" },
  slotHint: { fontSize: "0.75rem", fontWeight: 500, color: "var(--text-muted)" },
  pickBtn: { fontSize: "0.8rem", padding: "6px 14px", fontWeight: 700 },
  fileList: { display: "flex", flexWrap: "wrap", gap: "6px" },
  fileChip: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "4px 10px",
    borderRadius: "999px",
    backgroundColor: "rgba(99, 102, 241, 0.1)",
    color: "var(--text-secondary)",
    fontSize: "0.8rem",
  },
  removeBtn: { border: "none", background: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "0.8rem", padding: 0 },
  empty: { fontSize: "0.8rem", color: "var(--text-muted)" },
  status: { display: "flex", alignItems: "center", gap: "10px", fontSize: "0.9rem", fontWeight: 600, color: "var(--text-primary)" },
  spinner: {
    width: "18px",
    height: "18px",
    border: "2px solid rgba(99, 102, 241, 0.3)",
    borderTopColor: "var(--primary)",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  error: { fontSize: "0.85rem", color: "var(--danger)", lineHeight: 1.5 },
};
