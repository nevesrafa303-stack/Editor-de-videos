'use client';

import Link from 'next/link';
import { useRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

import { useIsDesktopPointer, usePrefersReducedMotion } from '@/lib/hooks/useMediaQuery';

import styles from './Button.module.css';

type Variant = 'primary' | 'outline' | 'ghost';
type Size = 'md' | 'lg';

type CommonProps = {
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  /** Desliga o hover magnetico onde ele nao faz sentido (ex.: dentro de forms). */
  magnetic?: boolean;
  className?: string;
};

type AnchorProps = CommonProps & {
  href: string;
  external?: boolean;
  onClick?: () => void;
};

type NativeButtonProps = CommonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'> & {
    href?: undefined;
  };

export type ButtonProps = AnchorProps | NativeButtonProps;

/** Deslocamento maximo do efeito magnetico, em pixels. */
const MAGNET_STRENGTH = 7;

/**
 * CTA do site.
 *
 * O hover magnetico so existe em desktop com ponteiro fino e sem
 * `prefers-reduced-motion`. Ele mexe apenas em `transform`, entao nao gera
 * layout e nao rouba o clique: o elemento continua exatamente onde o usuario
 * apontou.
 */
export function Button(props: ButtonProps) {
  const {
    children,
    variant = 'primary',
    size = 'md',
    magnetic = true,
    className,
  } = props;

  const ref = useRef<HTMLElement>(null);
  const isDesktopPointer = useIsDesktopPointer();
  const prefersReducedMotion = usePrefersReducedMotion();
  const magnetEnabled = magnetic && isDesktopPointer && !prefersReducedMotion;

  const magnetHandlers = magnetEnabled
    ? {
        onPointerMove: (event: React.PointerEvent<HTMLElement>) => {
          const element = ref.current;
          if (!element) return;
          const rect = element.getBoundingClientRect();
          const x = (event.clientX - (rect.left + rect.width / 2)) / rect.width;
          const y = (event.clientY - (rect.top + rect.height / 2)) / rect.height;
          element.style.transform = `translate3d(${x * MAGNET_STRENGTH * 2}px, ${y * MAGNET_STRENGTH * 2}px, 0)`;
        },
        onPointerLeave: () => {
          const element = ref.current;
          if (element) element.style.transform = '';
        },
      }
    : {};

  const classes = [styles.button, styles[variant], styles[size], className]
    .filter(Boolean)
    .join(' ');

  const content = (
    <>
      <span className={styles.label}>{children}</span>
      <span aria-hidden="true" className={styles.sheen} />
    </>
  );

  if (typeof props.href === 'string') {
    const { href, external, onClick } = props;

    if (external) {
      return (
        <a
          ref={ref as React.RefObject<HTMLAnchorElement>}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={classes}
          onClick={onClick}
          {...magnetHandlers}
        >
          {content}
        </a>
      );
    }

    return (
      <Link
        ref={ref as React.RefObject<HTMLAnchorElement>}
        href={href}
        className={classes}
        onClick={onClick}
        {...magnetHandlers}
      >
        {content}
      </Link>
    );
  }

  const { variant: _variant, size: _size, magnetic: _magnetic, className: _className, children: _children, ...buttonProps } =
    props as NativeButtonProps;

  return (
    <button
      ref={ref as React.RefObject<HTMLButtonElement>}
      className={classes}
      {...buttonProps}
      {...magnetHandlers}
    >
      {content}
    </button>
  );
}
