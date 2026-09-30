/**
 * Animated Shiny Text — from 21st.dev (Magic UI, @dillionverma), https://magicui.design/r/animated-shiny-text.json
 * Adapted: Tailwind v4 `bg-size-[…]` / `bg-linear-to-r` rewritten for Tailwind v3; theme text colour.
 */
import type { ComponentPropsWithoutRef, CSSProperties, FC } from 'react';
import { cn } from '@/lib/utils';

export interface AnimatedShinyTextProps extends ComponentPropsWithoutRef<'span'> {
  shimmerWidth?: number;
}

export const AnimatedShinyText: FC<AnimatedShinyTextProps> = ({ children, className, shimmerWidth = 100, ...props }) => (
  <span
    style={{ '--shiny-width': `${shimmerWidth}px` } as CSSProperties}
    className={cn(
      'text-muted',
      // shine
      'animate-shiny-text bg-clip-text bg-no-repeat [background-position:0_0] [background-size:var(--shiny-width)_100%]',
      '[transition:background-position_1s_cubic-bezier(.6,.6,0,1)_infinite]',
      // gradient
      'bg-gradient-to-r from-transparent via-ink/80 via-50% to-transparent',
      className,
    )}
    {...props}
  >
    {children}
  </span>
);
