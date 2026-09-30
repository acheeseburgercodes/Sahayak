/**
 * Blur Fade — from 21st.dev (Magic UI, @dillionverma), https://magicui.design/r/blur-fade.json
 * Unchanged apart from formatting; reduced motion is handled app-wide by <MotionConfig>.
 */
import { useRef } from 'react';
import type { ReactNode } from 'react';
import { AnimatePresence, motion, useInView } from 'motion/react';
import type { MotionProps, UseInViewOptions, Variants } from 'motion/react';

type MarginType = UseInViewOptions['margin'];

interface BlurFadeProps extends MotionProps {
  children: ReactNode;
  className?: string;
  variant?: { hidden: { y: number }; visible: { y: number } };
  duration?: number;
  delay?: number;
  offset?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
  inView?: boolean;
  inViewMargin?: MarginType;
  blur?: string;
}

const getFilter = (v: Variants[string]) => (typeof v === 'function' ? undefined : v.filter);

export function BlurFade({
  children,
  className,
  variant,
  duration = 0.4,
  delay = 0,
  offset = 6,
  direction = 'down',
  inView = false,
  inViewMargin = '-50px',
  blur = '6px',
  ...props
}: BlurFadeProps) {
  const ref = useRef(null);
  const inViewResult = useInView(ref, { once: true, margin: inViewMargin });
  const isInView = !inView || inViewResult;
  const axis = direction === 'left' || direction === 'right' ? 'x' : 'y';
  const defaultVariants: Variants = {
    hidden: {
      [axis]: direction === 'right' || direction === 'down' ? -offset : offset,
      opacity: 0,
      filter: `blur(${blur})`,
    },
    visible: { [axis]: 0, opacity: 1, filter: 'blur(0px)' },
  };
  const combined = variant ?? defaultVariants;
  const hiddenFilter = getFilter(combined.hidden);
  const visibleFilter = getFilter(combined.visible);
  const transitionFilter = hiddenFilter != null && visibleFilter != null && hiddenFilter !== visibleFilter;

  return (
    <AnimatePresence>
      <motion.div
        ref={ref}
        initial="hidden"
        animate={isInView ? 'visible' : 'hidden'}
        exit="hidden"
        variants={combined}
        transition={{
          delay: 0.04 + delay,
          duration,
          ease: 'easeOut',
          ...(transitionFilter ? { filter: { duration } } : {}),
        }}
        className={className}
        {...props}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
