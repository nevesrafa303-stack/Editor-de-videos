import { SectionTitle } from '@/components/ui/SectionTitle';
import { WhatsAppLink } from '@/components/layout/WhatsAppLink';
import { faq } from '@/lib/config/faq';

import styles from './Faq.module.css';

/**
 * Perguntas frequentes.
 *
 * Construída com `<details>`/`<summary>` nativos: abre e fecha sem uma linha
 * de JavaScript, funciona com teclado, é anunciada corretamente por leitor de
 * tela e o conteúdo continua no HTML para o Google indexar mesmo fechado.
 *
 * O conteúdo vem de `src/lib/config/faq.ts`, que também alimenta o JSON-LD
 * FAQPage — uma fonte só para a tela e para a busca.
 */
export function Faq() {
  return (
    <section id="duvidas" className={`section ${styles.section}`} aria-label="Perguntas frequentes">
      <div className={`container ${styles.inner}`}>
        <SectionTitle
          eyebrow="Dúvidas"
          title={'Antes de\nvocê perguntar.'}
          description="As perguntas que mais chegam pelo WhatsApp, respondidas aqui para você não precisar esperar resposta."
          className={styles.head}
        />

        <div className={styles.lista}>
          {faq.map((item) => (
            <details key={item.pergunta} className={styles.item} name="faq">
              <summary className={styles.pergunta}>
                <span>{item.pergunta}</span>
                <span className={styles.icone} aria-hidden="true" />
              </summary>
              <div className={styles.respostaWrap}>
                <p className={styles.resposta}>{item.resposta}</p>
              </div>
            </details>
          ))}

          <p className={styles.rodape}>
            Ficou uma dúvida que não está aqui?{' '}
            <WhatsAppLink source="faq" className={styles.rodapeLink}>
              Pergunte no WhatsApp
            </WhatsAppLink>
          </p>
        </div>
      </div>
    </section>
  );
}
