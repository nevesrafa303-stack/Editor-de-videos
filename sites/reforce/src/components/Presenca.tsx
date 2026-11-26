import { marca, presenca } from "@/content/site";
import { MAPA_ESTADOS, MAPA_VIEWBOX } from "@/lib/mapa-brasil";
import { Kicker, TituloSecao } from "./ui";

// Posições no mapa (unidades do viewBox 613 x 639), calculadas a partir das coordenadas das cidades.
const ESCRITORIOS = [
  { id: "sapucaia", x: 357, y: 568, ...marca.escritorios[0] },
  { id: "ouro-branco", x: 473.5, y: 408, ...marca.escritorios[1] },
];
// Rotas de mobilização: dos escritórios para os estados com atuação.
const ROTAS = [
  "M357 568 Q 338 498 396 442",
  "M357 568 Q 452 520 473.5 408",
  "M473.5 408 Q 500 412 488 434",
  "M473.5 408 Q 330 170 140 142",
  "M357 568 Q 150 390 140 142",
  "M473.5 408 Q 432 404 396 442",
];
const ativos = new Set(presenca.estados.map((e) => e.uf));

export function Presenca() {
  return (
    <section id="presenca" data-presenca className="relative overflow-hidden bg-abismo py-24 md:py-32">
      <span className="pointer-events-none absolute right-[-10%] top-1/4 size-[40rem] rounded-full bg-verde/[0.07] blur-3xl" aria-hidden="true" />
      <div className="container-site relative grid items-center gap-14 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <Kicker>{presenca.kicker}</Kicker>
          <TituloSecao className="mt-6">{presenca.titulo}</TituloSecao>
          <p data-reveal className="mt-6 max-w-lg text-lg leading-relaxed text-mute">
            {presenca.texto}
          </p>

          <ul className="mt-10 flex flex-wrap gap-2" aria-label="Estados com atuação">
            {presenca.estados.map((e) => (
              <li key={e.uf}>
                <button
                  type="button"
                  data-estado-mapa={e.uf}
                  className="flex items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-nevoa transition hover:border-laranja hover:text-white focus-visible:border-laranja"
                >
                  <span className="font-display text-xs font-bold uppercase text-menta">{e.uf}</span>
                  {e.nome}
                </button>
              </li>
            ))}
          </ul>

          <dl className="mt-10 grid gap-4 sm:grid-cols-3">
            <div className="cartao flex flex-col p-5">
              <dt className="order-2 mt-1 text-sm text-mute">consultores especializados</dt>
              <dd className="font-display text-4xl font-semibold text-white">
                +<span data-count="25">25</span>
              </dd>
            </div>
            {ESCRITORIOS.map((o) => (
              <div key={o.id} className="cartao flex flex-col p-5">
                <dt className="order-2 mt-1 text-sm text-mute">{o.tipo === "Sede" ? "Escritório sede" : "Escritório filial"}</dt>
                <dd className="font-display text-xl font-semibold leading-tight text-white">
                  {o.cidade}
                  <span className="block text-sm font-medium text-menta">{o.uf}</span>
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <figure className="relative mx-auto w-full max-w-[38rem]">
          <svg viewBox={MAPA_VIEWBOX} className="h-auto w-full overflow-visible" role="img" aria-labelledby="mapa-titulo">
            <title id="mapa-titulo">
              Mapa do Brasil com atuação em Rio Grande do Sul, São Paulo, Rio de Janeiro, Minas Gerais e Amazonas, e escritórios
              em Sapucaia (RS) e Ouro Branco (MG).
            </title>
            <defs>
              <linearGradient id="mapa-degrade" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#4fd1a5" />
                <stop offset="1" stopColor="#00bda1" />
              </linearGradient>
            </defs>
            <g>
              {MAPA_ESTADOS.map((e) => (
                <path
                  key={e.uf}
                  d={e.d}
                  data-uf={e.uf}
                  className="mapa-estado"
                  data-ativo={ativos.has(e.uf) ? "" : undefined}
                />
              ))}
            </g>
            <g aria-hidden="true">
              {ROTAS.map((d) => (
                <path key={d} d={d} pathLength={1} data-rota className="mapa-rota" />
              ))}
            </g>
            <g aria-hidden="true">
              {ESCRITORIOS.map((o) => (
                <g key={o.id} transform={`translate(${o.x} ${o.y})`} className="text-laranja">
                  <circle r="16" fill="#f7852a" fillOpacity="0.18" className="pino-onda" />
                  <circle r="7" fill="#f7852a" stroke="#011417" strokeWidth="2.5" />
                  <text
                    x={o.id === "sapucaia" ? -14 : 14}
                    y="-14"
                    textAnchor={o.id === "sapucaia" ? "end" : "start"}
                    fill="#fff"
                    fontSize="15"
                    fontWeight="600"
                    fontFamily="var(--font-poppins)"
                  >
                    {o.cidade}
                    <tspan fill="#93abaa" fontWeight="400" fontSize="12">
                      {" "}
                      · {o.tipo}
                    </tspan>
                  </text>
                </g>
              ))}
            </g>
          </svg>
          <figcaption className="mt-4 flex flex-wrap items-center gap-5 text-xs text-mute">
            <span className="flex items-center gap-2">
              <span className="size-3 rounded-sm bg-menta" /> Estados com atuação
            </span>
            <span className="flex items-center gap-2">
              <span className="size-3 rounded-full bg-laranja" /> Escritórios
            </span>
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
