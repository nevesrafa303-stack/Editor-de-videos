import { numeros } from "@/content/site";
import { vars } from "./ui";

type Numero = { prefixo: string; valor: number; unidade: string; leitura: string };

// Coluna de dígitos de um contador: 0–9 duas vezes. O último dígito dá uma volta a mais que os outros,
// como num painel mecânico. Sem animação (globals.css), a coluna já fica parada no número final.
function Contador({ n }: { n: Numero }) {
  const digitos = String(n.valor).split("");
  return (
    <span data-contador className="whitespace-nowrap text-ouro">
      <span className="sr-only">{n.leitura}</span>
      <span aria-hidden="true">
        {n.prefixo}
        {digitos.map((d, i) => {
          const alvo = Number(d) + (i === digitos.length - 1 ? 10 : 0);
          return (
            <span key={i} className="contador-janela">
              <span data-coluna data-alvo={alvo} className="contador-coluna" style={vars({ "--alvo": alvo })}>
                {Array.from({ length: 20 }, (_, k) => (
                  <span key={k}>{k % 10}</span>
                ))}
              </span>
            </span>
          );
        })}
        {n.unidade}
      </span>
    </span>
  );
}

// Números da operação numa frase só, lida com a rolagem: as palavras acendem uma a uma e os números
// rolam como contadores de painel até o valor (data-leitura em src/lib/motion.ts). Volta ao subir.
export function Numeros() {
  return (
    <section aria-labelledby="numeros-titulo" className="relative py-28 md:py-40">
      <div className="container-site">
        <h2 id="numeros-titulo" className="sr-only">
          {numeros.titulo}
        </h2>
        <p
          data-leitura
          className="font-expanded mx-auto max-w-[64rem] text-center text-[clamp(1.5rem,3.25vw,3.05rem)] font-bold leading-[1.2] tracking-[-0.015em] text-white"
        >
          {numeros.frase.map((parte, i) =>
            typeof parte === "string" ? (
              parte.split(/(\s+)/).map((p, j) =>
                p.trim() ? (
                  <span key={`${i}-${j}`} data-palavra>
                    {p}
                  </span>
                ) : (
                  p
                ),
              )
            ) : (
              <Contador key={i} n={parte} />
            ),
          )}
        </p>
      </div>
    </section>
  );
}
