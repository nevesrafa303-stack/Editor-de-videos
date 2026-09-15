import type { ReactNode } from "react";
import { cn } from "@/ui";

/**
 * Barras horizontais comparativas.
 *
 * Por que HTML e CSS e nao SVG: a primeira versao foi SVG inline, e SVG te
 * obriga a decidir a largura antes de saber quanto espaco existe. Nome de
 * procedimento longo em tela de 13" ou telefone de recepcao passava por cima
 * da barra, porque texto dentro de `viewBox` nao reflui. Em CSS a trilha e uma
 * fracao da coluna, o rotulo quebra sozinho e nada precisa de JavaScript. A
 * unica coisa que o SVG daria a mais aqui — curva, eixo, marcacao densa —
 * nenhum destes graficos usa.
 *
 * O que a forma garante:
 *
 *   - MARCA FINA sobre trilha recessiva. A barra e o dado; a trilha e so a
 *     escala, e nao pode competir com ele.
 *   - PONTA ARREDONDADA so na ponta do dado. A base fica reta na linha zero:
 *     arredondar os dois lados faz a barra curta parecer maior do que e.
 *   - ORDEM DE COR FIXA. Serie 1 e sempre a cor 1, independente de quantas
 *     linhas o filtro deixou.
 *   - NUMERO ESCRITO em toda linha, em tinta de texto e nao na cor da serie.
 *     A cor identifica; quem le o valor le o algarismo. E e o que faz o grafico
 *     continuar servindo para quem usa leitor de tela: a barra e decorativa,
 *     o texto e o dado.
 *   - LEGENDA a partir de duas series. Com uma so, o titulo do painel ja diz
 *     o que a barra mede, e uma caixinha repetindo isso e ruido.
 */

export type SerieBarra = {
  rotulo: string;
  /** Slot de cor. Ordem fixa: 1 e 2 sao as categoricas; `critico` e estado. */
  cor: "1" | "2" | "critico";
};

export type LinhaBarra = {
  /** Identidade estável da linha. Dois profissionais podem ter o mesmo nome. */
  chave: string;
  rotulo: string;
  meta?: ReactNode;
  /** Um valor por serie, na mesma ordem. */
  valores: number[];
  /** O valor ja formatado, um por serie. E o que a pessoa le. */
  textos: string[];
  destaque?: ReactNode;
};

const COR = {
  "1": "bg-chart-1",
  "2": "bg-chart-2",
  critico: "bg-critical",
} as const;

export function Barras({
  series,
  linhas,
  vazio,
  className,
}: {
  series: SerieBarra[];
  linhas: LinhaBarra[];
  vazio: string;
  className?: string;
}) {
  if (linhas.length === 0) {
    return <p className={cn("px-5 py-6 text-sm text-muted", className)}>{vazio}</p>;
  }

  // Escala unica para todas as series: e o ponto do grafico. Cada serie com
  // sua propria escala e o mesmo erro do eixo duplo — duas barras do mesmo
  // tamanho significando numeros diferentes.
  const maximo = Math.max(1, ...linhas.flatMap((l) => l.valores));

  return (
    <div className={cn("px-5 py-4", className)}>
      {series.length > 1 ? (
        <ul className="mb-4 flex flex-wrap gap-4">
          {series.map((s) => (
            <li key={s.rotulo} className="flex items-center gap-1.5 text-xs text-muted">
              <span className={cn("block h-2.5 w-2.5 rounded-xs", COR[s.cor])} aria-hidden />
              {s.rotulo}
            </li>
          ))}
        </ul>
      ) : null}

      <ul className="flex flex-col gap-3.5">
        {linhas.map((linha) => (
          <li key={linha.chave} className="grid gap-x-4 gap-y-1 sm:grid-cols-[minmax(0,11rem)_1fr]">
            <div className="min-w-0">
              <p className="text-sm font-medium text-ink">{linha.rotulo}</p>
              {linha.meta ? <p className="text-xs text-muted">{linha.meta}</p> : null}
            </div>

            <div className="flex min-w-0 flex-col gap-0.5 self-center">
              {series.map((serie, i) => {
                const valor = linha.valores[i] ?? 0;
                const largura = Math.max((valor / maximo) * 100, valor > 0 ? 1.5 : 0);

                return (
                  <div key={serie.rotulo} className="flex items-center gap-2.5">
                    <div
                      className="h-2 min-w-0 flex-1 rounded-xs bg-chart-track"
                      title={`${linha.rotulo} · ${serie.rotulo}: ${linha.textos[i] ?? ""}`}
                    >
                      <div
                        className={cn("h-full rounded-r-[4px] transition-[width]", COR[serie.cor])}
                        style={{ width: `${largura}%` }}
                        aria-hidden
                      />
                    </div>
                    <span className="num w-28 shrink-0 text-right text-sm text-ink-soft">
                      {linha.textos[i]}
                    </span>
                  </div>
                );
              })}
            </div>

            {linha.destaque ? (
              <p className="text-xs text-muted sm:col-start-2">{linha.destaque}</p>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
