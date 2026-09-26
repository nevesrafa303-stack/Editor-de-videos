import { ServiceShortcut } from '@/components/booking/ServiceShortcut';
import { Reveal } from '@/components/ui/Reveal';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { getService } from '@/lib/config/services';

import styles from './Audience.module.css';

/**
 * Quando procurar a Arena.
 *
 * Seção de qualificação: o visitante raramente chega sabendo o nome do
 * serviço, mas sempre sabe a SITUAÇÃO em que está. Aqui ele se reconhece em
 * uma delas e sai com o serviço certo já selecionado no agendamento.
 *
 * O link leva direto ao formulário com o serviço pré-escolhido via hash, o
 * que corta duas etapas de quem chegou por aqui.
 */
const SITUACOES = [
  {
    momento: 'Carro novo',
    titulo: 'Proteger antes do primeiro erro.',
    texto:
      'O melhor momento de proteger uma pintura é enquanto ela ainda está perfeita. Corrigir depois custa verniz; proteger antes não custa nada além do processo.',
    servico: 'vitrificacao',
  },
  {
    momento: 'Seminovo recém-comprado',
    titulo: 'Tirar a história do dono anterior.',
    texto:
      'Você não sabe como aquele carro foi lavado nos últimos anos — nem quem sentou nos bancos. Higienização e descontaminação zeram esse histórico.',
    servico: 'higienizacao-interna',
  },
  {
    momento: 'Antes de vender',
    titulo: 'O carro é avaliado em trinta segundos.',
    texto:
      'Pintura com brilho, interior sem odor e faróis transparentes mudam a conversa antes da primeira pergunta sobre o preço.',
    servico: 'polimento-tecnico',
  },
  {
    momento: 'Manutenção',
    titulo: 'Manter é mais barato que recuperar.',
    texto:
      'Carro que passa por lavagem técnica com regularidade não acumula o desgaste que depois exige correção. É o ciclo que evita o retrabalho.',
    servico: 'lavagem-tecnica',
  },
];

export function Audience() {
  return (
    <section className={`section ${styles.section}`} aria-label="Quando procurar a Arena">
      <div className={`container ${styles.inner}`}>
        <SectionTitle
          eyebrow="Para quem é"
          title={'Quando procurar\na Arena.'}
          description="Quatro momentos em que o cuidado muda o resultado. Se o seu carro está em um deles, o serviço indicado já vai marcado no agendamento."
        />

        <ul className={styles.grid}>
          {SITUACOES.map((situacao, index) => {
            const servico = getService(situacao.servico);

            return (
              <Reveal
                as="li"
                key={situacao.momento}
                variant="up"
                delay={index * 70}
                className={styles.card}
              >
                <p className={styles.momento}>{situacao.momento}</p>
                <h3 className={styles.titulo}>{situacao.titulo}</h3>
                <p className={styles.texto}>{situacao.texto}</p>

                {servico !== null ? (
                  <ServiceShortcut slug={servico.slug} source="audience" className={styles.link}>
                    <span className={styles.linkLabel}>Começar por {servico.name}</span>
                    <span aria-hidden="true" className={styles.seta}>
                      →
                    </span>
                  </ServiceShortcut>
                ) : null}
              </Reveal>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
