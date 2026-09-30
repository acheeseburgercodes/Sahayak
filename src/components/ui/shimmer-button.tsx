/**
 * Shimmer Button — from 21st.dev (Magic UI, @dillionverma), https://magicui.design/r/shimmer-button.json
 * Adapted: Tailwind v3 (`@container-[size]` → container-type, `inset-(--cut)` →
 * arbitrary value), brand background, and a visible focus ring.
 */
import { forwardRef } from 'react';
import type { ComponentPropsWithoutRef, CSSProperties, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface ShimmerButtonProps extends ComponentPropsWithoutRef<'button'> {
  shimmerColor?: string;
  shimmerSize?: string;
  borderRadius?: string;
  shimmerDuration?: string;
  background?: string;
  className?: string;
  children?: ReactNode;
}

export const ShimmerButton = forwardRef<HTMLButtonElement, ShimmerButtonProps>(function ShimmerButton(
  {
    shimmerColor = '#ffffff',
    shimmerSize = '0.06em',
    shimmerDuration = '3s',
    borderRadius = '100px',
    background = 'rgb(var(--c-brand))',
    className,
    children,
    type = 'button',
    ...props
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      style={
        {
          '--spread': '90deg',
          '--shimmer-color': shimmerColor,
          '--radius': borderRadius,
          '--speed': shimmerDuration,
          '--cut': shimmerSize,
          '--bg': background,
        } as CSSProperties
      }
      className={cn(
        'group relative z-0 flex min-h-[48px] cursor-pointer items-center justify-center gap-2 overflow-hidden whitespace-nowrap',
        '[border-radius:var(--radius)] border border-white/10 px-6 py-3 font-semibold text-brandInk [background:var(--bg)]',
        'transform-gpu transition-transform duration-300 ease-in-out active:translate-y-px',
        'focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-brand',
        className,
      )}
      {...props}
    >
      {/* spark container */}
      <div aria-hidden="true" className="absolute inset-0 -z-30 overflow-visible blur-[2px] [container-type:size]">
        <div className="animate-shimmer-slide absolute inset-0 aspect-square h-[100cqh] rounded-none [mask:none]">
          <div className="animate-spin-around absolute -inset-full w-auto rotate-0 [translate:0_0] [background:conic-gradient(from_calc(270deg-(var(--spread)*0.5)),transparent_0,var(--shimmer-color)_var(--spread),transparent_var(--spread))]" />
        </div>
      </div>

      {children}

      {/* highlight */}
      <div
        aria-hidden="true"
        className="absolute inset-0 size-full rounded-2xl shadow-[inset_0_-8px_10px_#ffffff1f] transform-gpu transition-all duration-300 ease-in-out
                   group-hover:shadow-[inset_0_-6px_10px_#ffffff3f] group-active:shadow-[inset_0_-10px_10px_#ffffff3f]"
      />

      {/* backdrop */}
      <div aria-hidden="true" className="absolute inset-[var(--cut)] -z-20 [border-radius:var(--radius)] [background:var(--bg)]" />
    </button>
  );
});
