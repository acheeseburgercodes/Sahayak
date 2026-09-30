/**
 * Border Beam — from 21st.dev (Magic UI, @dillionverma), https://magicui.design/r/border-beam.json
 * Adapted: Tailwind v4 utilities (`border-(length:…)`, `bg-linear-to-l`, `mask-intersect`)
 * rewritten as Tailwind v3 arbitrary values; theme colours by default.
 */
import { motion } from 'motion/react';
import type { MotionStyle, Transition } from 'motion/react';
import type { CSSProperties } from 'react';
import { cn } from '@/lib/utils';

interface BorderBeamProps {
  size?: number;
  duration?: number;
  delay?: number;
  colorFrom?: string;
  colorTo?: string;
  transition?: Transition;
  className?: string;
  style?: CSSProperties;
  reverse?: boolean;
  initialOffset?: number;
  borderWidth?: number;
}

export function BorderBeam({
  className,
  size = 60,
  delay = 0,
  duration = 6,
  colorFrom = 'rgb(var(--c-brand))',
  colorTo = 'rgb(var(--c-warn))',
  transition,
  style,
  reverse = false,
  initialOffset = 0,
  borderWidth = 1.5,
}: BorderBeamProps) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 rounded-[inherit] border-[length:var(--border-beam-width)] border-transparent
                 [mask-clip:padding-box,border-box] [mask-composite:intersect]
                 [mask:linear-gradient(transparent,transparent),linear-gradient(#000,#000)]"
      style={{ '--border-beam-width': `${borderWidth}px` } as CSSProperties}
    >
      <motion.div
        className={cn(
          'absolute aspect-square bg-gradient-to-l from-[var(--color-from)] via-[var(--color-to)] to-transparent',
          className,
        )}
        style={
          {
            width: size,
            offsetPath: `rect(0 auto auto 0 round ${size}px)`,
            '--color-from': colorFrom,
            '--color-to': colorTo,
            ...style,
          } as MotionStyle
        }
        initial={{ offsetDistance: `${initialOffset}%` }}
        animate={{
          offsetDistance: reverse
            ? [`${100 - initialOffset}%`, `${-initialOffset}%`]
            : [`${initialOffset}%`, `${100 + initialOffset}%`],
        }}
        transition={{ repeat: Infinity, ease: 'linear', duration, delay: -delay, ...transition }}
      />
    </div>
  );
}
