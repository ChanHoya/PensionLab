'use client';

import React, { useEffect, useState, useRef } from 'react';

interface NumberPopInProps {
  value: number | string;
  prefix?: string;
  suffix?: string;
  className?: string;
  formatter?: (val: number | string) => string;
}

export const NumberPopIn: React.FC<NumberPopInProps> = ({
  value,
  prefix = '',
  suffix = '',
  className = '',
  formatter,
}) => {
  const [displayValue, setDisplayValue] = useState<string>(
    formatter ? formatter(value) : String(value)
  );
  const [isAnimating, setIsAnimating] = useState(false);
  const prevValueRef = useRef<number | string>(value);

  useEffect(() => {
    if (prevValueRef.current !== value) {
      prevValueRef.current = value;
      const formatted = formatter ? formatter(value) : String(value);
      setDisplayValue(formatted);
      setIsAnimating(false);

      // 브라우저 리플로우 후 애니메이션 클래스 재적용 (transitions.dev number pop-in 규칙)
      const timer = requestAnimationFrame(() => {
        setIsAnimating(true);
      });

      const resetTimer = setTimeout(() => {
        setIsAnimating(false);
      }, 500);

      return () => {
        cancelAnimationFrame(timer);
        clearTimeout(resetTimer);
      };
    }
  }, [value, formatter]);

  const chars = displayValue.split('');

  return (
    <span
      className={`t-digit-group ${isAnimating ? 'is-animating' : ''} ${className}`}
      style={{ display: 'inline-flex', alignItems: 'baseline' }}
    >
      {prefix && <span style={{ marginRight: '2px' }}>{prefix}</span>}
      {chars.map((char, index) => {
        // 숫자 뒤쪽 자리(1, 2번째)에 stagger 딜레이를 주어 생동감 부여
        const staggerIndex = chars.length - 1 - index;
        const stagger = staggerIndex < 3 ? staggerIndex + 1 : 0;
        return (
          <span
            key={`${index}-${char}`}
            className="t-digit"
            data-stagger={stagger > 0 ? String(stagger) : undefined}
          >
            {char}
          </span>
        );
      })}
      {suffix && <span style={{ marginLeft: '2px' }}>{suffix}</span>}
    </span>
  );
};
