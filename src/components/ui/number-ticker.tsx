/**
 * Number Ticker — from 21st.dev (Magic UI, @dillionverma), https://magicui.design/r/number-ticker.json
 * Adapted: theme colours, Indian digit grouping, an `instant` switch for reduced
 * motion, and the final value exposed to screen readers once (the animated
 * digits are aria-hidden so a reader never hears every intermediate number).
 */
import { useEffect, useRef } from 'react';
import type { ComponentPropsWithoutRef } from 'react';
import { useInView, useMotionValue, useSpring } from 'motion/react';
import { cn } from '@/lib/utils';

interface NumberTickerProps extends ComponentPropsWithoutRef<'span'> {
  value: number;
  startValue?: number;
  direction?: 'up' | 'down';
  delay?: number;
  decimalPlaces?: number;
  /** Skip the animation (reduced motion). */
  instant?: boolean;
  prefix?: string;
}

const format = (n: number, dp: number) =>
  Intl.NumberFormat('en-IN', { minimumFractionDigits: dp, maximumFractionDigits: dp }).format(Number(n.toFixed(dp)));

export function NumberTicker({
  value,
  startValue = 0,
  direction = 'up',
  delay = 0,
  className,
  decimalPlaces = 0,
  instant = false,
  prefix = '',
  ...props
}: NumberTickerProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(direction === 'down' ? value : startValue);
  const springValue = useSpring(motionValue, { damping: 60, stiffness: 100 });
  const isInView = useInView(ref, { once: true, margin: '0px' });

  useEffect(() => {
    if (instant) {
      if (ref.current) ref.current.textContent = prefix + format(value, decimalPlaces);
      return;
    }
    let timer: ReturnType<typeof setTimeout> | null = null;
    if (isInView) {
      timer = setTimeout(() => motionValue.set(direction === 'down' ? startValue : value), delay * 1000);
    }
    return () => {
      if (timer !== null) clearTimeout(timer);
    };
  }, [motionValue, isInView, delay, value, direction, startValue, instant, prefix, decimalPlaces]);

  useEffect(
    () =>
      springValue.on('change', (latest) => {
        if (ref.current && !instant) ref.current.textContent = prefix + format(latest, decimalPlaces);
      }),
    [springValue, decimalPlaces, instant, prefix],
  );

  return (
    <span className={cn('inline-block tabular-nums tracking-wide text-ink', className)} {...props}>
      <span ref={ref} aria-hidden="true">
        {prefix}
        {format(instant ? value : startValue, decimalPlaces)}
      </span>
      <span className="sr-only">
        {prefix}
        {format(value, decimalPlaces)}
      </span>
    </span>
  );
}
