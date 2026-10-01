'use client';

import { Fragment, useEffect, useRef, useState, type ElementType } from 'react';

import styles from './AnimatedText.module.css';

type AnimatedTextProps = {
  /** Texto puro. Quebras de linha intencionais: use `\n`. */
  text: string;
  as?: ElementType;
  className?: string;
  /** Intervalo entre palavras, em ms. Acima de ~60ms a frase soa arrastada. */
  stagger?: number;
  delay?: number;
};

/**
 * Revelacao de texto palavra a palavra.
 *
 * Decisoes de composicao editorial:
 *   - as palavras quebram naturalmente (nao ha uma palavra por linha);
 *   - cada palavra e' um `span` com `overflow: hidden`, entao a subida acontece
 *     dentro da propria linha — sem empurrar layout;
 *   - o texto completo continua no DOM para leitores de tela e para o SEO,
 *     porque os espacos sao preservados entre os spans.
 */
export function AnimatedText({
  text,
  as: Tag = 'span',
  className,
  stagger = 45,
  delay = 0,
}: AnimatedTextProps) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.2 },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const lines = text.split('\n');
  let wordIndex = -1;

  return (
    <Tag ref={ref} className={[styles.text, className].filter(Boolean).join(' ')} data-visible={visible}>
      {lines.map((line, lineNumber) => (
        <span key={lineNumber} className={styles.line}>
          {/* Espaco entre linhas: invisivel (a linha e' bloco), mas impede que
              extratores de texto colem "linha1linha2". */}
          {lineNumber > 0 ? ' ' : null}
          {line.split(' ').map((word, index, words) => {
            wordIndex += 1;
            return (
              <Fragment key={`${lineNumber}-${index}`}>
                <span className={styles.word}>
                  <span
                    data-reveal="up"
                    className={styles.inner}
                    style={{ transitionDelay: `${delay + wordIndex * stagger}ms` }}
                  >
                    {word}
                  </span>
                </span>
                {index < words.length - 1 ? ' ' : null}
              </Fragment>
            );
          })}
        </span>
      ))}
    </Tag>
  );
}
