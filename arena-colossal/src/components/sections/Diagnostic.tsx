'use client';

import { useMemo, useState } from 'react';

import { EVENTO_SELECIONAR_SERVICO } from '@/components/booking/ServiceShortcut';
import { Button } from '@/components/ui/Button';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { WhatsAppLink } from '@/components/layout/WhatsAppLink';
import { track } from '@/lib/analytics';
import {
  montarObservacao,
  montarRecomendacao,
  perguntas,
  type Respostas,
} from '@/lib/config/diagnostic';
import { formatDuration } from '@/lib/utils/format';

import styles from './Diagnostic.module.css';

/**
 * Diagnóstico interativo.
 *
 * É a parte do site que o visitante FAZ, não lê. Quatro perguntas e o processo
 * do carro dele aparece montado na ordem técnica correta, com o motivo de cada
 * etapa e o tempo somado.
 *
 * Roda inteiramente no cliente, sem requisição: a resposta é instantânea e
 * continua funcionando se a API estiver fora. O resultado é rotulado como
 * ponto de partida — a avaliação presencial é quem decide, como o resto do
 * site afirma.
 *
 * O botão final não só abre o agendamento: seleciona o serviço principal e
 * cola o processo sugerido nas observações, para a Arena receber o pedido já
 * sabendo do que se trata.
 */
export function Diagnostic() {
  const [respostas, setRespostas] = useState<Respostas>({});
  const [indice, setIndice] = useState(0);
  const [concluido, setConcluido] = useState(false);

  const recomendacao = useMemo(() => montarRecomendacao(respostas), [respostas]);
  const perguntaAtual = perguntas[indice];
  const total = perguntas.length;

  const responder = (perguntaId: string, opcaoId: string) => {
    const proximas = { ...respostas, [perguntaId]: opcaoId };
    setRespostas(proximas);

    if (indice < total - 1) {
      setIndice(indice + 1);
      return;
    }

    setConcluido(true);
    track('view_service', { source: 'diagnostico', service: montarRecomendacao(proximas).principal?.slug ?? '' });
  };

  const recomeçar = () => {
    setRespostas({});
    setIndice(0);
    setConcluido(false);
  };

  const irParaAgendamento = () => {
    const principal = recomendacao.principal;
    if (principal === null) return;

    window.dispatchEvent(
      new CustomEvent(EVENTO_SELECIONAR_SERVICO, {
        detail: { slug: principal.slug, observacao: montarObservacao(recomendacao, respostas) },
      }),
    );
    track('start_booking', { source: 'diagnostico', service: principal.slug });
  };

  return (
    <section id="diagnostico" className={`section ${styles.section}`} aria-label="Diagnóstico">
      <div className={`container ${styles.inner}`}>
        <SectionTitle
          eyebrow="Diagnóstico"
          title={'Monte o processo\ndo seu carro.'}
          description="Quatro perguntas. No fim, as etapas na ordem em que precisam acontecer, com o motivo de cada uma e o tempo somado."
          className={styles.head}
        />

        <div className={styles.painel}>
          {!concluido && perguntaAtual ? (
            <div className={styles.pergunta}>
              <div className={styles.contador}>
                <span className={styles.contadorAtual}>{String(indice + 1).padStart(2, '0')}</span>
                <span className={styles.contadorTotal}>/ {String(total).padStart(2, '0')}</span>
                <span className={styles.barra} aria-hidden="true">
                  <span
                    className={styles.barraPreenchida}
                    style={{ transform: `scaleX(${(indice + (respostas[perguntaAtual.id] ? 1 : 0)) / total})` }}
                  />
                </span>
              </div>

              <fieldset className={styles.campo}>
                <legend className={styles.titulo}>{perguntaAtual.titulo}</legend>
                <p className={styles.ajuda}>{perguntaAtual.ajuda}</p>

                <div className={styles.opcoes}>
                  {perguntaAtual.opcoes.map((opcao) => (
                    <button
                      key={opcao.id}
                      type="button"
                      className={styles.opcao}
                      data-selected={respostas[perguntaAtual.id] === opcao.id}
                      onClick={() => responder(perguntaAtual.id, opcao.id)}
                    >
                      <span className={styles.opcaoRotulo}>{opcao.rotulo}</span>
                      <span className={styles.opcaoDetalhe}>{opcao.detalhe}</span>
                    </button>
                  ))}
                </div>
              </fieldset>

              {indice > 0 ? (
                <button type="button" className={styles.voltar} onClick={() => setIndice(indice - 1)}>
                  Voltar
                </button>
              ) : null}
            </div>
          ) : null}

          {concluido ? (
            <div className={styles.resultado} aria-live="polite">
              <p className={styles.resultadoEyebrow}>Processo sugerido</p>
              <p className={styles.resumo}>{recomendacao.resumo}</p>

              {recomendacao.itens.length > 0 ? (
                <>
                  <ol className={styles.etapas}>
                    {recomendacao.itens.map((item, index) => (
                      <li key={item.service.slug} className={styles.etapa}>
                        <span className={styles.etapaIndice}>{String(index + 1).padStart(2, '0')}</span>
                        <span className={styles.etapaCorpo}>
                          <span className={styles.etapaNome}>{item.service.name}</span>
                          <span className={styles.etapaMotivo}>por causa de: {item.motivo}</span>
                        </span>
                        <span className={styles.etapaTempo}>
                          {formatDuration(item.service.durationMinutes)}
                        </span>
                      </li>
                    ))}
                  </ol>

                  <p className={styles.total}>
                    <span>Tempo somado das etapas</span>
                    <strong>{formatDuration(recomendacao.duracaoTotal)}</strong>
                  </p>
                </>
              ) : null}

              <p className={styles.aviso}>
                Isto é um ponto de partida, não um orçamento. Pintura não se lê por formulário — a
                combinação final é definida na avaliação, com o carro na frente.
              </p>

              <div className={styles.acoes}>
                {recomendacao.principal !== null ? (
                  <Button href="#agendamento" magnetic={false} onClick={irParaAgendamento}>
                    Agendar {recomendacao.principal.name}
                  </Button>
                ) : (
                  <Button href="#agendamento" magnetic={false}>
                    Agendar avaliação
                  </Button>
                )}

                <WhatsAppLink source="diagnostico" className={styles.whats}>
                  Discutir o processo no WhatsApp
                </WhatsAppLink>
              </div>

              <button type="button" className={styles.voltar} onClick={recomeçar}>
                Refazer o diagnóstico
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
