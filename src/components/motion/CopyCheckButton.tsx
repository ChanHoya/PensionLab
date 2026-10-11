'use client';

import React, { useState } from 'react';

interface CopyCheckButtonProps {
  textToCopy: string;
  label?: string;
  copiedLabel?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const CopyCheckButton: React.FC<CopyCheckButtonProps> = ({
  textToCopy,
  label = '복사',
  copiedLabel = '복사됨',
  className = '',
  style,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`btn-action-tool ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '5px 10px',
        borderRadius: '6px',
        fontSize: '12px',
        fontWeight: 600,
        cursor: 'pointer',
        border: copied
          ? '1px solid var(--success)'
          : '1px solid var(--border)',
        background: copied
          ? 'rgba(16, 185, 129, 0.12)'
          : 'var(--surface-2)',
        color: copied ? 'var(--success-light)' : 'var(--text-secondary)',
        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        ...style,
      }}
      title={copied ? '클립보드에 복사되었습니다' : `${textToCopy} 복사`}
    >
      {copied ? (
        <span className="t-success-check" aria-hidden="true">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" className="t-check-draw-path" />
          </svg>
        </span>
      ) : (
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      )}
      <span>{copied ? copiedLabel : label}</span>
    </button>
  );
};
