import { services } from '@/lib/config/services';

import styles from './ServicesMarquee.module.css';

/**
 * Faixa de serviços em movimento contínuo.
 *
 * Função na página: costurar o manifesto à seção de serviços e dar peso
 * visual à transição sem exigir foto nenhuma — o que importa no mobile, onde
 * uma seção só de texto seguida de outra só de texto começa a parecer vazia.
 *
 * É decorativa: os mesmos dez nomes aparecem logo abaixo, na seção de
 * serviços. Por isso a faixa inteira é `aria-hidden` — repetir vinte nomes
 * para quem usa leitor de tela seria ruído, não conteúdo.
 *
 * A duplicação da lista é o que torna o laço contínuo: a trilha anda -50% e
 * volta ao início sem emenda visível.
 */
export function ServicesMarquee() {
  const items = services.map((service) => service.name);

  return (
    <div className={styles.marquee} aria-hidden="true">
      <div className={styles.track}>
        {[0, 1].map((copy) => (
          <ul key={copy} className={styles.list}>
            {items.map((name) => (
              <li key={name} className={styles.item}>
                <span className={styles.dot} />
                {name}
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}
