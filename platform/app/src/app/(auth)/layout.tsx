import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <main className="flex items-center justify-center px-5 py-12 sm:px-8">
        <div className="w-full max-w-sm">{children}</div>
      </main>

      <aside className="hidden flex-col justify-between bg-ink px-12 py-14 lg:flex">
        <p className="font-mono text-[11px] tracking-[0.16em] text-structure uppercase">
          Plataforma clínica
        </p>

        <div>
          <p className="max-w-md text-3xl leading-[1.15] font-bold text-white text-balance">
            O prontuário, a agenda e o caixa da clínica no mesmo lugar.
          </p>
          <ul className="mt-8 max-w-md space-y-3 text-sm text-white/70">
            {[
              "Cada rede enxerga apenas os próprios dados, garantido no banco",
              "Aplicação de injetável guarda lote e validade, paciente por paciente",
              "Orçamento aprovado vira parcela a receber na mesma transação",
              "Quem abriu o prontuário fica registrado",
            ].map((item) => (
              <li key={item} className="flex gap-2.5">
                <span aria-hidden className="text-structure">
                  ▸
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-white/40">
          Dado de saúde é dado sensível. O acesso é registrado.
        </p>
      </aside>
    </div>
  );
}
