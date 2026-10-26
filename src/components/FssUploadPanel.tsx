// 금융감독원 통합연금포털 안내, 일괄 업로드 드롭존 및 항목별 개별 업로드 패널 컴포넌트
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
  dropzone?: React.ReactNode;
  activeWho?: Who;
  onWhoChange?: (w: Who) => void;
}

// 금감원 통합연금포털 PDF 업로드 (안내, 일괄 업로드 드롭존, 항목별 개별 업로드)
export default function FssUploadPanel({
  hasSpouse,
  files,
  onChange,
  analyzing,
  error,
  onOpenPersonaModal,
  dropzone,
  activeWho,
  onWhoChange,
}: Props) {
  const [internalWho, setInternalWho] = useState<Who>("SELF");
  const who = activeWho !== undefined ? activeWho : internalWho;
  const setWho = (w: Who) => {
    if (onWhoChange) onWhoChange(w);
    setInternalWho(w);
  };

  const current = files[who];

  return (
    <div style={styles.wrap} className="animate-fade-in">
      {/* 1. 금융감독원 안내 박스 (제목 오른쪽에 사이트 링크 포함) */}
      <div style={styles.infoAlert}>
        <div style={styles.infoHeader}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "1.1rem" }}>📄</span>
            <strong style={{ fontSize: "0.95rem", color: "var(--text-primary, #ffffff)" }}>
              금융감독원 통합연금포털 PDF 및 엑셀(CSV) 등록
            </strong>
          </div>
          <a
            href="https://100lifeplan.fss.or.kr/"
            target="_blank"
            rel="noopener noreferrer"
            style={styles.portalInlineLink}
          >
            https://100lifeplan.fss.or.kr/ ↗
          </a>
        </div>
        <p style={styles.alertText}>
          통합연금포털의 항목별 화면을 PDF 또는 엑셀/CSV로 다운로드하여 아래 칸에 등록한 뒤 「다음 단계」를 누르면, AI 엔진이 1층(국민연금)·2층(퇴직연금)·3층(개인연금)의
          「입력결과」에 자동으로 채웁니다. 채워진 값은 각 단계에서 직접 고칠 수 있습니다.
        </p>
        <p style={styles.alertText}>
          ℹ️ 통합연금포털은 <strong>회원가입(본인인증) 후</strong> 이용할 수 있습니다. 가입 후 처음 연금정보를 조회하면 국민연금공단·금융회사에서
          정보를 모으는 데 <strong>일정 기간이 걸려</strong> 바로 PDF를 받을 수 없으니, 미리 가입하고 조회를 신청해 두세요.
        </p>
        <p style={{ ...styles.alertText, color: "var(--text-accent, #818cf8)" }}>
          💡 본인 자료 조회 가능 전까지{" "}
          <span
            onClick={onOpenPersonaModal}
            style={{
              color: "var(--primary-600, #6366f1)",
              fontWeight: 700,
              textDecoration: "underline",
              cursor: onOpenPersonaModal ? "pointer" : "default",
            }}
          >
            오른쪽 페르소나 체험하기
          </span>
          를 통해 서비스를 사용해보세요.
        </p>
        <p style={{ ...styles.alertText, color: "var(--warning, #f59e0b)" }}>
          ⚠️ 다운로드 시 설정된 PDF 비밀번호(보통 생년월일 6자리 또는 설정한 비밀번호)를 반드시 해제(인쇄용 PDF 저장 등으로 무암호화)한 후 업로드해주셔야
          자동 파싱이 가능합니다. (CSV/TXT 파일은 암호 해제 없이 즉시 업로드 가능)
        </p>
      </div>

      {/* 2. 일괄 업로드 드롭존 박스 (안내 박스 바로 아래 배치) */}
      {dropzone}

      {/* 3. 본인/배우자 연금정보 파일 개별 업로드 박스 (유사 박스 포맷) */}
      <div style={styles.individualBox}>
        <div style={styles.individualHeader}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "1.1rem" }}>📁</span>
              <strong style={{ fontSize: "0.95rem", color: "var(--text-primary, #ffffff)" }}>
                본인/배우자 연금정보 파일 개별 업로드
              </strong>
              <span style={styles.individualTargetBadge}>
                {who === "SELF" ? "본인 파일" : "배우자 파일"}
              </span>
            </div>
            <p style={{ margin: "4px 0 0 0", fontSize: "0.78rem", color: "var(--text-secondary, #94a3b8)" }}>
              항목별 파일을 하나씩 넣거나 개별 추가 업로드할 수 있습니다.
            </p>
          </div>

          {hasSpouse && (
            <div style={styles.whoTabs}>
              {(["SELF", "SPOUSE"] as Who[]).map((w) => {
                const count = FSS_SLOTS.reduce((n, s) => n + files[w][s.key].length, 0);
                const isSelected = w === who;
                return (
                  <button
                    key={w}
                    type="button"
                    onClick={() => setWho(w)}
                    style={{
                      ...styles.whoTab,
                      ...(isSelected ? (w === "SELF" ? styles.whoTabActiveSelf : styles.whoTabActiveSpouse) : null),
                    }}
                  >
                    <span>{w === "SELF" ? "👤" : "👥"}</span> {w === "SELF" ? "본인 자료" : "배우자 자료"}
                    {count > 0 && <span style={styles.whoTabCount}>({count})</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 컴팩트 항목 리스트 (세로 빈 공간 최소화 및 제목 옆 파일명 나열) */}
        <div style={styles.slotList}>
          {FSS_SLOTS.map((slot) => {
            const inputId = `fss-file-${who}-${slot.key}`;
            const list = current[slot.key];
            return (
              <div key={slot.key} style={styles.compactSlot}>
                {/* 좌측: 항목 제목 및 나열된 파일명 배지 */}
                <div style={styles.slotMain}>
                  <div style={styles.slotTitleGroup}>
                    <span style={styles.slotLabel}>{slot.label}</span>
                    {slot.multiple && <span style={styles.slotHint}>(복수 등록 가능)</span>}
                  </div>

                  {/* 항목 제목 오른쪽에 업로드된 파일명 나열 */}
                  <div style={styles.fileChipsRow}>
                    {list.length > 0 ? (
                      list.map((f, i) => (
                        <span key={`${f.name}-${i}`} style={styles.fileChip}>
                          <span style={{ fontSize: "0.75rem" }}>📎</span>
                          <span style={styles.fileNameText} title={f.name}>
                            {f.name}
                          </span>
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
                      ))
                    ) : (
                      <span style={styles.emptyText}>등록된 파일 없음</span>
                    )}
                  </div>
                </div>

                {/* 우측: 파일 선택 버튼 */}
                <div style={styles.slotAction}>
                  <input
                    id={inputId}
                    type="file"
                    accept=".pdf,.csv,.txt,.tsv,.xlsx"
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
                    {slot.multiple && list.length ? "+ 파일 추가" : list.length ? "파일 변경" : "파일 선택"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {analyzing && (
        <div style={styles.status}>
          <div style={styles.spinner} />
          등록한 파일을 읽어 AI로 고속 분석하는 중입니다...
        </div>
      )}
      {error && <div style={styles.error}>⚠️ {error}</div>}
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  wrap: { display: "flex", flexDirection: "column", gap: "14px" },
  infoAlert: {
    backgroundColor: "rgba(99, 102, 241, 0.06)",
    border: "1px solid rgba(99, 102, 241, 0.2)",
    borderLeft: "4px solid #6366f1",
    borderRadius: "12px",
    padding: "14px 18px",
    fontSize: "0.88rem",
    color: "var(--text-primary, #ffffff)",
  },
  infoHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "10px",
    marginBottom: "8px",
  },
  portalInlineLink: {
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    fontSize: "0.82rem",
    fontWeight: 700,
    color: "#818cf8",
    textDecoration: "underline",
    backgroundColor: "rgba(99, 102, 241, 0.12)",
    border: "1px solid rgba(99, 102, 241, 0.35)",
    padding: "4px 10px",
    borderRadius: "6px",
    transition: "all 0.15s ease",
  },
  alertText: { fontSize: "0.82rem", marginTop: 4, color: "var(--text-secondary, #94a3b8)", lineHeight: 1.5 },

  // 개별 업로드 컨테이너 박스
  individualBox: {
    borderRadius: "14px",
    border: "1px dashed rgba(99, 102, 241, 0.35)",
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    padding: "16px 18px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  individualHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "10px",
    paddingBottom: "10px",
    borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
  },
  individualTargetBadge: {
    fontSize: "0.72rem",
    fontWeight: 700,
    padding: "2px 8px",
    borderRadius: "6px",
    backgroundColor: "rgba(99, 102, 241, 0.2)",
    color: "#a5b4fc",
    border: "1px solid rgba(99, 102, 241, 0.35)",
  },
  whoTabs: { display: "flex", gap: "6px" },
  whoTab: {
    padding: "5px 12px",
    borderRadius: "8px",
    border: "1px solid rgba(255, 255, 255, 0.12)",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    color: "var(--text-secondary, #94a3b8)",
    fontWeight: 600,
    fontSize: "0.8rem",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: "5px",
    transition: "all 0.15s ease",
  },
  whoTabActiveSelf: {
    background: "rgba(99, 102, 241, 0.25)",
    color: "#818cf8",
    borderColor: "#6366f1",
  },
  whoTabActiveSpouse: {
    background: "rgba(236, 72, 153, 0.25)",
    color: "#f472b6",
    borderColor: "#ec4899",
  },
  whoTabCount: { fontSize: "0.72rem", fontWeight: 700, opacity: 0.9 },

  // 세로 공간 최소화 슬롯
  slotList: { display: "flex", flexDirection: "column", gap: "6px" },
  compactSlot: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 12px",
    borderRadius: "8px",
    border: "1px solid rgba(255, 255, 255, 0.06)",
    backgroundColor: "rgba(255, 255, 255, 0.015)",
    gap: "10px",
    transition: "all 0.15s ease",
  },
  slotMain: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
    flex: 1,
    minWidth: 0,
  },
  slotTitleGroup: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    minWidth: "165px",
  },
  slotLabel: {
    fontSize: "0.85rem",
    fontWeight: 700,
    color: "var(--text-primary, #ffffff)",
    whiteSpace: "nowrap",
  },
  slotHint: {
    fontSize: "0.72rem",
    color: "var(--text-muted, #64748b)",
    whiteSpace: "nowrap",
  },
  fileChipsRow: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    flexWrap: "wrap",
  },
  fileChip: {
    display: "inline-flex",
    alignItems: "center",
    gap: "5px",
    padding: "3px 9px",
    borderRadius: "6px",
    backgroundColor: "rgba(99, 102, 241, 0.14)",
    border: "1px solid rgba(99, 102, 241, 0.3)",
    color: "#c7d2fe",
    fontSize: "0.78rem",
    fontWeight: 500,
  },
  fileNameText: {
    maxWidth: "200px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  removeBtn: {
    border: "none",
    background: "none",
    color: "#f87171",
    cursor: "pointer",
    fontSize: "0.8rem",
    padding: "0 2px",
    lineHeight: 1,
  },
  emptyText: {
    fontSize: "0.76rem",
    color: "var(--text-muted, #64748b)",
  },
  slotAction: { flexShrink: 0 },
  pickBtn: {
    fontSize: "0.78rem",
    padding: "5px 12px",
    fontWeight: 600,
    borderRadius: "6px",
  },
  status: { display: "flex", alignItems: "center", gap: "10px", fontSize: "0.88rem", fontWeight: 600, color: "var(--text-primary)" },
  spinner: {
    width: "16px",
    height: "16px",
    border: "2px solid rgba(99, 102, 241, 0.3)",
    borderTopColor: "#6366f1",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  error: { fontSize: "0.82rem", color: "#f87171", lineHeight: 1.5 },
};
