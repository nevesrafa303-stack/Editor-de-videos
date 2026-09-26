import { describe, expect, it } from 'vitest';

import {
  montarObservacao,
  montarRecomendacao,
  perguntas,
  type Respostas,
} from '@/lib/config/diagnostic';

/**
 * O diagnóstico fala em nome da Arena: ele sugere o que fazer com o carro de
 * alguém. Estes testes travam as invariantes que não podem se perder quando os
 * pesos forem ajustados.
 */
const TODAS_AS_COMBINACOES = (() => {
  const saida: Respostas[] = [];
  const passo = (indice: number, atual: Respostas) => {
    const pergunta = perguntas[indice];
    if (!pergunta) {
      saida.push(atual);
      return;
    }
    for (const opcao of pergunta.opcoes) passo(indice + 1, { ...atual, [pergunta.id]: opcao.id });
  };
  passo(0, {});
  return saida;
})();

/** Sequência técnica: nenhuma etapa pode aparecer antes do que a habilita. */
const ORDEM = [
  'lavagem-tecnica',
  'descontaminacao',
  'polimento-tecnico',
  'restauracao-farois',
  'vitrificacao',
  'higienizacao-interna',
  'higienizacao-couro',
  'higienizacao-ar-condicionado',
  'protecao-plasticos',
  'protecao-pneus',
];

describe('motor do diagnóstico', () => {
  it('cobre todas as combinações sem quebrar', () => {
    expect(TODAS_AS_COMBINACOES).toHaveLength(256);
    for (const respostas of TODAS_AS_COMBINACOES) {
      expect(() => montarRecomendacao(respostas)).not.toThrow();
    }
  });

  it('é determinístico', () => {
    const r: Respostas = { rotina: 'litoral', pintura: 'marcada', interior: 'odor', objetivo: 'vender' };
    const a = montarRecomendacao(r);
    const b = montarRecomendacao(r);
    expect(a.itens.map((i) => i.service.slug)).toEqual(b.itens.map((i) => i.service.slug));
    expect(a.duracaoTotal).toBe(b.duracaoTotal);
  });

  it('sempre respeita a sequência técnica', () => {
    for (const respostas of TODAS_AS_COMBINACOES) {
      const slugs = montarRecomendacao(respostas).itens.map((i) => i.service.slug);
      const posicoes = slugs.map((slug) => ORDEM.indexOf(slug));
      const ordenadas = [...posicoes].sort((a, b) => a - b);
      expect(posicoes, `ordem quebrada em ${JSON.stringify(respostas)}`).toEqual(ordenadas);
    }
  });

  it('nunca sugere trabalho de pintura sem a lavagem técnica antes', () => {
    const exigemBase = ['descontaminacao', 'polimento-tecnico', 'vitrificacao'];

    for (const respostas of TODAS_AS_COMBINACOES) {
      const slugs = montarRecomendacao(respostas).itens.map((i) => i.service.slug);
      if (!slugs.some((slug) => exigemBase.includes(slug))) continue;

      expect(slugs, `sem base em ${JSON.stringify(respostas)}`).toContain('lavagem-tecnica');
      expect(slugs[0]).toBe('lavagem-tecnica');
    }
  });

  it('nunca devolve uma lista do tamanho do catálogo', () => {
    for (const respostas of TODAS_AS_COMBINACOES) {
      expect(montarRecomendacao(respostas).itens.length).toBeLessThanOrEqual(6);
    }
  });

  it('não repete serviço na mesma recomendação', () => {
    for (const respostas of TODAS_AS_COMBINACOES) {
      const slugs = montarRecomendacao(respostas).itens.map((i) => i.service.slug);
      expect(new Set(slugs).size).toBe(slugs.length);
    }
  });

  it('dá um motivo legível para cada etapa', () => {
    for (const respostas of TODAS_AS_COMBINACOES) {
      for (const item of montarRecomendacao(respostas).itens) {
        expect(item.motivo.length).toBeGreaterThan(3);
      }
    }
  });

  it('soma a duração das etapas escolhidas', () => {
    const rec = montarRecomendacao({
      rotina: 'litoral',
      pintura: 'marcada',
      interior: 'odor',
      objetivo: 'vender',
    });
    const soma = rec.itens.reduce((t, i) => t + i.service.durationMinutes, 0);
    expect(rec.duracaoTotal).toBe(soma);
  });

  it('o serviço principal é o primeiro da sequência', () => {
    for (const respostas of TODAS_AS_COMBINACOES) {
      const rec = montarRecomendacao(respostas);
      if (rec.itens.length === 0) {
        expect(rec.principal).toBeNull();
        continue;
      }
      expect(rec.principal?.slug).toBe(rec.itens[0]?.service.slug);
    }
  });

  it('a observação colada no agendamento cita todas as etapas', () => {
    const respostas: Respostas = {
      rotina: 'estrada',
      pintura: 'opaca',
      interior: 'uso',
      objetivo: 'recuperar',
    };
    const rec = montarRecomendacao(respostas);
    const texto = montarObservacao(rec, respostas);

    for (const item of rec.itens) expect(texto).toContain(item.service.name);
    // E também o que a pessoa respondeu, para a Arena ler o contexto.
    expect(texto).toContain('Muita estrada');
  });

  it('não gera observação quando não há recomendação', () => {
    expect(montarObservacao({ itens: [], duracaoTotal: 0, principal: null, resumo: '' }, {})).toBe('');
  });
});
