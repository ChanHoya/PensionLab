"use client";

import { useEffect, useState } from "react";

// 사파리(구버전)·iPadOS는 webkit 접두사 API만 있다
type FsDocument = Document & {
  webkitFullscreenElement?: Element | null;
  webkitFullscreenEnabled?: boolean;
  webkitExitFullscreen?: () => Promise<void> | void;
};
type FsElement = HTMLElement & { webkitRequestFullscreen?: () => Promise<void> | void };

// 브라우저 탭·주소창을 숨기고 페이지 내용만 화면 가득 보이게 하는 토글 (다시 누르거나 Esc로 복귀)
// 아이폰 사파리는 웹페이지 전체화면을 지원하지 않아 「홈 화면에 추가」 방법을 안내한다 (manifest: standalone)
export default function FullscreenToggle({ style }: { style?: React.CSSProperties }) {
  const [isFull, setIsFull] = useState(false);

  useEffect(() => {
    const doc = document as FsDocument;
    const sync = () => setIsFull(!!(doc.fullscreenElement || doc.webkitFullscreenElement));
    document.addEventListener("fullscreenchange", sync);
    document.addEventListener("webkitfullscreenchange", sync);
    return () => {
      document.removeEventListener("fullscreenchange", sync);
      document.removeEventListener("webkitfullscreenchange", sync);
    };
  }, []);

  const toggle = async () => {
    const doc = document as FsDocument;
    const el = document.documentElement as FsElement;
    try {
      if (doc.fullscreenElement || doc.webkitFullscreenElement) {
        await (doc.exitFullscreen ? doc.exitFullscreen() : doc.webkitExitFullscreen?.());
      } else if (doc.fullscreenEnabled || doc.webkitFullscreenEnabled) {
        await (el.requestFullscreen ? el.requestFullscreen() : el.webkitRequestFullscreen?.());
      } else {
        alert(
          "이 브라우저는 전체화면을 지원하지 않습니다.\n아이폰 사파리에서는 공유 버튼 → 「홈 화면에 추가」로 추가한 뒤 홈 화면 아이콘으로 열면 주소창 없이 볼 수 있습니다."
        );
      }
    } catch (err) {
      console.warn("전체화면 전환 실패:", err);
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      id="btn-toggle-fullscreen"
      title={isFull ? "전체화면 끄기 (Esc)" : "전체화면으로 보기 (브라우저 탭·주소창 숨김)"}
      aria-label={isFull ? "전체화면 끄기" : "전체화면으로 보기"}
      style={{
        background: "var(--surface-hover)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-sm)",
        width: "38px",
        height: "38px",
        fontSize: "1.1rem",
        color: "var(--text-primary)",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "all var(--transition-fast)",
        flexShrink: 0,
        ...style,
      }}
    >
      {isFull ? "⤡" : "⤢"}
    </button>
  );
}
