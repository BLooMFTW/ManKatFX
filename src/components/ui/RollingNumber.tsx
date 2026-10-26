import React, { useEffect, useState, useRef } from 'react';

interface RollingNumberProps {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
  colorCode?: boolean; // Green for positive, red for negative
  triggerKey?: any; // Re-triggers rolling animation on change (e.g. currentTab)
  duration?: number; // Duration in ms (default: 650ms)
}

export const RollingNumber: React.FC<RollingNumberProps> = ({
  value,
  prefix = '',
  suffix = '',
  decimals = 2,
  className = '',
  colorCode = false,
  triggerKey,
  duration = 650,
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  const prevValueRef = useRef<number>(0);
  const prevTriggerRef = useRef(triggerKey);
  const isInitialMount = useRef(true);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const isTriggerChanged = triggerKey !== undefined && prevTriggerRef.current !== triggerKey;
    prevTriggerRef.current = triggerKey;

    const isFirst = isInitialMount.current;
    isInitialMount.current = false;

    // Skip only if not first mount, value hasn't changed, and triggerKey hasn't changed
    if (!isFirst && prevValueRef.current === value && !isTriggerChanged) {
      return;
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplayValue(value);
      prevValueRef.current = value;
      return;
    }

    // Roll up from 0 on first render or tab switch, or from previous value on update
    const startValue = isFirst || isTriggerChanged ? 0 : prevValueRef.current;
    const endValue = isNaN(value) ? 0 : value;
    prevValueRef.current = endValue;

    const animDuration = Math.max(duration, 350);
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / animDuration, 1);
      // easeOutExpo
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = startValue + (endValue - startValue) * ease;

      setDisplayValue(current);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(endValue);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [value, triggerKey, duration]);

  const numVal = isNaN(displayValue) ? 0 : displayValue;
  const isNeg = numVal < -0.0001;
  const isPos = numVal > 0.0001;

  const formattedNum = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(Math.abs(numVal));

  let colorClass = '';
  if (colorCode) {
    if (isPos) colorClass = 'text-emerald-400';
    else if (isNeg) colorClass = 'text-rose-400';
    else colorClass = 'text-zinc-400';
  }

  return (
    <span className={`font-mono tabular-nums tracking-tight ${colorClass} ${className}`}>
      {isNeg ? '-' : ''}
      {prefix}
      {formattedNum}
      {suffix}
    </span>
  );
};
