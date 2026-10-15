import { Reveal } from '@/components/ui/Reveal';
import { SectionTitle } from '@/components/ui/SectionTitle';

import styles from './Standards.module.css';

/**
 * Padrões técnicos.
 *
 * Deliberadamente sobre MÉTODO, não sobre promessas: nada aqui afirma prazo,
 * preço, garantia ou número. São as regras de execução que já estão descritas
 * no processo e nos serviços — ditas de forma direta.
 *
 * Também resolve um problema de composição: é uma seção densa de texto, sem
 * foto, entre dois blocos muito visuais. No mobile é o que mantém a leitura
 * andando quando as imagens ainda não existem.
 */
const PADROES = [
  {
    titulo: 'A pintura se lê antes de se corrigir.',
    texto:
      'Espessura, tipo de defeito e histórico do verniz vêm primeiro. Polir sem medir é apostar com a camada que o carro tem para o resto da vida.',
  },
  {
    titulo: 'Toque mínimo.',
    texto:
      'Pré-lavagem, luvas separadas por área e secagem controlada. A maior parte dos micro-riscos de um carro não vem da rua: vem de quem lava.',
  },
  {
    titulo: 'Proteção só sobre superfície preparada.',
    texto:
      'Vitrificação aplicada sobre pintura contaminada sela o defeito junto. Se a preparação não fechou, a proteção espera.',
  },
  {
    titulo: 'Cada superfície com o seu produto.',
    texto:
      'Couro, plástico técnico, tecido, borracha e vidro pedem químicas diferentes. Produto único para tudo é atalho, e atalho aparece em seis meses.',
  },
  {
    titulo: 'Conferência sob iluminação técnica.',
    texto:
      'O que a luz do galpão esconde, a luz certa mostra. A checagem final não é no olho: é sob a iluminação que revela hologramas e marcas de passe.',
  },
  {
    titulo: 'Entrega explicada.',
    texto:
      'Você sai sabendo o que foi feito, o que foi corrigido, o que não era possível corrigir e como manter o resultado.',
  },
];

export function Standards() {
  return (
    <section className={`section ${styles.section}`} aria-label="Padrões técnicos">
      <div className={`container ${styles.inner}`}>
        <SectionTitle
          eyebrow="Critério"
          title={'O que não\nabre mão.'}
          description="Seis regras que não mudam por pressa, por preço ou por pedido. São elas que separam um carro lavado de um carro tratado."
          className={styles.head}
        />

        <ol className={styles.list}>
          {PADROES.map((padrao, index) => (
            <Reveal as="li" key={padrao.titulo} variant="up" delay={index * 60} className={styles.item}>
              <span className={styles.index}>{String(index + 1).padStart(2, '0')}</span>
              <h3 className={styles.itemTitle}>{padrao.titulo}</h3>
              <p className={styles.itemText}>{padrao.texto}</p>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
