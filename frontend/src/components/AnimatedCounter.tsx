import React, { useEffect, useRef } from 'react';
import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from 'motion/react';

interface AnimatedCounterProps {
  value: number;
  suffix?: string;
  prefix?: string;
  formatCompact?: boolean;
  durationMs?: number;
  className?: string;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value = 0,
  suffix = '',
  prefix = '',
  formatCompact = false,
  durationMs = 1400,
  className = '',
}) => {
  const safeValue =
    typeof value === 'number' && !Number.isNaN(value) ? value : 0;
  const ref = useRef<HTMLSpanElement | null>(null);
  const isInView = useInView(ref, { once: true, margin: '-40px' });
  const prefersReducedMotion = useReducedMotion();
  const count = useMotionValue(0);

  const formatValue = (currentValue: number) => {
    const currentCount = Math.round(currentValue);
    const formattedCount = formatCompact
      ? currentCount >= 1000
        ? `${Math.floor(currentCount / 1000)}K`
        : currentCount.toLocaleString('en-IN')
      : currentCount.toLocaleString('en-IN');

    return `${prefix}${formattedCount}${suffix}`;
  };
  const formattedCount = useTransform(count, formatValue);
  const finalValue = formatValue(safeValue);

  useEffect(() => {
    if (!isInView) return;

    if (prefersReducedMotion) {
      count.set(safeValue);
      return;
    }

    const controls = animate(count, safeValue, {
      duration: durationMs / 1000,
      ease: 'easeOut',
    });
    return () => controls.stop();
  }, [count, durationMs, isInView, prefersReducedMotion, safeValue]);

  return (
    <motion.span
      ref={ref}
      className={`tabular-nums inline-block ${className}`}
      style={{ minWidth: `${finalValue.length}ch` }}
    >
      {formattedCount}
    </motion.span>
  );
};
