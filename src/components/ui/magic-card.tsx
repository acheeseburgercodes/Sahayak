/**
 * Magic Card — from 21st.dev (Magic UI, @dillionverma), https://magicui.design/r/magic-card.json
 * Adapted: Tailwind v3 syntax, theme tokens instead of next-themes, gradient mode only,
 * and the spotlight also follows keyboard focus so it is not a mouse-only effect.
 */
import { useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import { motion, useMotionTemplate, useMotionValue } from 'motion/react';
import { cn } from '@/lib/utils';

interface MagicCardProps {
  children?: ReactNode;
  className?: string;
  gradientSize?: number;
  /** Inner spotlight colour. Defaults to a soft brand tint. */
  gradientColor?: string;
  gradientOpacity?: number;
  /** Border glow stops. */
  gradientFrom?: string;
  gradientTo?: string;
}

export function MagicCard({
  children,
  className,
  gradientSize = 220,
  gradientColor = 'rgb(var(--c-brand) / 0.10)',
  gradientOpacity = 1,
  gradientFrom = 'rgb(var(--c-brand))',
  gradientTo = 'rgb(var(--c-warn))',
}: MagicCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(-gradientSize);
  const mouseY = useMotionValue(-gradientSize);

  const reset = useCallback(() => {
    mouseX.set(-gradientSize);
    mouseY.set(-gradientSize);
  }, [gradientSize, mouseX, mouseY]);

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      mouseX.set(e.clientX - rect.left);
      mouseY.set(e.clientY - rect.top);
    },
    [mouseX, mouseY],
  );

  // Keyboard users get the same glow, centred on the card's top edge.
  const onFocus = useCallback(() => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set(rect.width / 2);
    mouseY.set(0);
  }, [mouseX, mouseY]);

  const border = useMotionTemplate`
    linear-gradient(rgb(var(--c-panel)) 0 0) padding-box,
    radial-gradient(${gradientSize}px circle at ${mouseX}px ${mouseY}px,
      ${gradientFrom}, ${gradientTo}, rgb(var(--c-line)) 100%) border-box`;
  const spot = useMotionTemplate`radial-gradient(${gradientSize}px circle at ${mouseX}px ${mouseY}px, ${gradientColor}, transparent 100%)`;

  return (
    <motion.div
      ref={ref}
      className={cn('group relative isolate overflow-hidden rounded-xl border border-transparent', className)}
      onPointerMove={onPointerMove}
      onPointerLeave={reset}
      onFocusCapture={onFocus}
      onBlurCapture={reset}
      style={{ background: border }}
    >
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-px z-10 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100"
        style={{ background: spot, opacity: gradientOpacity }}
      />
      <div className="relative z-20 h-full">{children}</div>
    </motion.div>
  );
}
