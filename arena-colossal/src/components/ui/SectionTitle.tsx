import type { ReactNode } from 'react';

import { AnimatedText } from './AnimatedText';
import { Reveal } from './Reveal';
import styles from './SectionTitle.module.css';

type SectionTitleProps = {
  eyebrow?: string;
  /** Use `\n` para definir a quebra editorial do titulo. */
  title: string;
  description?: ReactNode;
  align?: 'left' | 'center';
  /** Nivel semantico correto para a posicao da secao na pagina. */
  as?: 'h2' | 'h3';
  className?: string;
};

export function SectionTitle({
  eyebrow,
  title,
  description,
  align = 'left',
  as = 'h2',
  className,
}: SectionTitleProps) {
  return (
    <header
      className={[styles.header, align === 'center' ? styles.center : '', className]
        .filter(Boolean)
        .join(' ')}
    >
      {eyebrow ? (
        <Reveal variant="fade">
          <p className="eyebrow">{eyebrow}</p>
        </Reveal>
      ) : null}

      <AnimatedText as={as} text={title} className={styles.title} />

      {description ? (
        <Reveal variant="up" delay={120}>
          <div className={styles.description}>{description}</div>
        </Reveal>
      ) : null}
    </header>
  );
}
