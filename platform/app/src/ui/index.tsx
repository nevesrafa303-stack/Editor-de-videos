import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

export function cn(...values: (string | false | null | undefined)[]): string {
  return values.filter(Boolean).join(" ");
}

// ------------------------------------------------------------------ botões --
const VARIANTS = {
  primary: "bg-structure text-white hover:bg-structure/90 shadow-xs",
  secondary: "border border-line bg-surface text-ink-soft hover:bg-sunken shadow-xs",
  accent: "bg-accent text-white hover:bg-accent/90 shadow-xs",
  ghost: "text-muted hover:bg-sunken hover:text-ink",
  danger: "border border-critical/30 bg-critical-soft text-critical hover:bg-critical/15",
} as const;

const SIZES = {
  sm: "px-2.5 py-1.5 text-xs gap-1.5",
  md: "px-3.5 py-2 text-sm gap-2",
  lg: "px-5 py-2.5 text-sm gap-2",
} as const;

type Style = {
  variant?: keyof typeof VARIANTS | undefined;
  size?: keyof typeof SIZES | undefined;
};

const style = ({ variant = "primary", size = "md" }: Style, extra?: string) =>
  cn(
    "inline-flex items-center justify-center rounded-md font-medium transition",
    "disabled:cursor-not-allowed disabled:opacity-50",
    VARIANTS[variant],
    SIZES[size],
    extra,
  );

export function Button({ variant, size, className, ...props }: ComponentProps<"button"> & Style) {
  return <button className={style({ variant, size }, className)} {...props} />;
}

export function LinkButton({
  variant,
  size,
  className,
  ...props
}: ComponentProps<typeof Link> & Style) {
  return <Link className={style({ variant, size }, className)} {...props} />;
}

// ------------------------------------------------------------------ blocos --
export function Panel({ className, ...props }: ComponentProps<"section">) {
  return (
    <section
      className={cn("rounded-lg border border-line bg-surface shadow-xs", className)}
      {...props}
    />
  );
}

export function PanelHead({
  title,
  hint,
  action,
}: {
  title: ReactNode;
  hint?: ReactNode | undefined;
  action?: ReactNode | undefined;
}) {
  return (
    <header className="flex items-start justify-between gap-4 border-b border-line px-5 py-3.5">
      <div className="min-w-0">
        <h2 className="text-sm font-semibold text-ink">{title}</h2>
        {hint ? <p className="mt-0.5 text-xs text-muted">{hint}</p> : null}
      </div>
      {action}
    </header>
  );
}

export function PageHead({
  title,
  meta,
  action,
}: {
  title: string;
  meta?: ReactNode | undefined;
  action?: ReactNode | undefined;
}) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight text-ink text-balance">{title}</h1>
        {meta ? <div className="mt-1 text-sm text-muted">{meta}</div> : null}
      </div>
      {action ? <div className="flex flex-wrap gap-2">{action}</div> : null}
    </header>
  );
}

// ------------------------------------------------------------------ inputs --
export function Field({
  label,
  hint,
  error,
  children,
  className,
}: {
  label: string;
  hint?: string | undefined;
  error?: string | undefined;
  children: ReactNode;
  className?: string | undefined;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="label">{label}</span>
      {children}
      {error ? (
        <span className="mt-1 block text-xs text-critical">{error}</span>
      ) : hint ? (
        <span className="mt-1 block text-xs text-muted">{hint}</span>
      ) : null}
    </label>
  );
}

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn("field", className)} {...props} />;
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return <select className={cn("field", className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn("field", className)} {...props} />;
}

// ------------------------------------------------------------------ sinais --
const TONES = {
  neutral: "border-line bg-sunken text-ink-soft",
  structure: "border-structure/25 bg-structure-soft text-structure",
  accent: "border-accent/25 bg-accent-soft text-accent",
  positive: "border-positive/25 bg-positive-soft text-positive",
  warning: "border-warning/25 bg-warning-soft text-warning",
  critical: "border-critical/25 bg-critical-soft text-critical",
} as const;

export type Tone = keyof typeof TONES;

export function Badge({
  tone = "neutral",
  className,
  ...props
}: ComponentProps<"span"> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        TONES[tone],
        className,
      )}
      {...props}
    />
  );
}

export function Notice({ tone = "critical", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <div className={cn("rounded-md border px-4 py-3 text-sm", TONES[tone])} role="status">
      {children}
    </div>
  );
}

/**
 * Aviso de erro do formulario.
 *
 * Nao repete o que ja esta no campo. Quando a validacao tem um problema so, a
 * mensagem especifica vai para o campo — e mostra-la tambem no topo faz o
 * leitor procurar dois erros onde ha um.
 */
export function FormError({
  error,
  fieldErrors,
}: {
  error?: string | undefined;
  fieldErrors?: Record<string, string[]> | undefined;
}) {
  if (!error) return null;

  const nosCampos = Object.values(fieldErrors ?? {}).some((msgs) => msgs.includes(error));
  if (nosCampos) return null;

  return <Notice>{error}</Notice>;
}

export function Empty({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string | undefined;
  action?: ReactNode | undefined;
}) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
      <p className="text-sm font-medium text-ink-soft">{title}</p>
      {hint ? <p className="max-w-sm text-sm text-muted">{hint}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

/**
 * Métrica. Usa `tone` para o número carregar o estado — saldo em atraso não
 * pode parecer com saldo quitado só porque os dois são números.
 */
export function Metric({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode | undefined;
  tone?: "neutral" | "positive" | "warning" | "critical" | "structure" | "accent";
}) {
  const color = {
    neutral: "text-ink",
    positive: "text-positive",
    warning: "text-warning",
    critical: "text-critical",
    structure: "text-structure",
    accent: "text-accent",
  }[tone];

  return (
    <div className="border-l-2 border-line pl-3">
      <p className="text-[11px] font-semibold tracking-[0.08em] text-muted uppercase">{label}</p>
      <p className={cn("num mt-1 text-xl font-bold", color)}>{value}</p>
      {hint ? <p className="mt-0.5 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}
