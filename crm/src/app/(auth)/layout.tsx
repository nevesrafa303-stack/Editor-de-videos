import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <main className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">{children}</div>
      </main>

      <aside className="hidden flex-col justify-between bg-brand-800 px-12 py-14 text-brand-50 lg:flex">
        <div className="text-lg font-semibold tracking-tight">OdontoCRM</div>

        <div>
          <p className="text-3xl leading-tight font-semibold text-white">
            Do primeiro contato no Instagram ao último boleto pago.
          </p>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-brand-100">
            Funil de vendas, agenda por profissional, prontuário com odontograma
            e financeiro com comissão — em um lugar só, feito para clínicas de
            odontologia e estética.
          </p>

          <ul className="mt-8 space-y-3 text-sm text-brand-100">
            {[
              "Saiba quanto cada origem de lead realmente fatura",
              "Agenda que bloqueia conflito de profissional e de sala",
              "Orçamento aprovado vira parcela a receber automaticamente",
              "Prontuário e anamnese com trilha de quem registrou",
            ].map((item) => (
              <li key={item} className="flex gap-2">
                <span aria-hidden className="text-brand-300">
                  —
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-brand-200">
          Dados de saúde sao sensiveis. Cada clínica enxerga apenas os proprios
          registros.
        </p>
      </aside>
    </div>
  );
}
