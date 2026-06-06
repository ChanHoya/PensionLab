"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle({ style }: { style?: React.CSSProperties }) {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("pensionlab_theme");
    const dark = saved !== "light"; // 다크 기본값
    setIsDark(dark);
  }, []);

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.setAttribute("data-theme", next ? "dark" : "");
    localStorage.setItem("pensionlab_theme", next ? "dark" : "light");
  };

  if (!mounted) return null;

  return (
    <button
      onClick={toggle}
      id="btn-toggle-theme"
      title={isDark ? "라이트 모드로 전환" : "다크 모드로 전환"}
      style={{
        background: "var(--surface-hover)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-sm)",
        width: "38px",
        height: "38px",
        fontSize: "1.1rem",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "all var(--transition-fast)",
        flexShrink: 0,
        ...style,
      }}
    >
      {isDark ? "☀️" : "🌙"}
    </button>
  );
}
