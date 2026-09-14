import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

export function cn(...values: (string | false | null | undefined)[]): string {
  return values.filter(Boolean).join(" ");
}

// ------------------------------------------------------------------ botoes --

const BUTTON_VARIANTS = {
  primary:
    "bg-brand-600 text-white hover:bg-brand-700 focus-visible:outline-brand-700 shadow-xs",
  secondary:
    "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 shadow-xs",
  ghost: "text-slate-600 hover:bg-slate-100",
  danger: "bg-rose-600 text-white hover:bg-rose-700 shadow-xs",
  subtle: "bg-brand-50 text-brand-700 hover:bg-brand-100",
} as const;

const BUTTON_SIZES = {
  sm: "px-2.5 py-1.5 text-xs gap-1.5",
  md: "px-3.5 py-2 text-sm gap-2",
  lg: "px-5 py-2.5 text-sm gap-2",
} as const;

type ButtonStyleProps = {
  variant?: keyof typeof BUTTON_VARIANTS;
  size?: keyof typeof BUTTON_SIZES;
};

function buttonClass({ variant = "primary", size = "md" }: ButtonStyleProps, extra?: string) {
  return cn(
    "inline-flex items-center justify-center rounded-lg font-medium transition",
    "disabled:cursor-not-allowed disabled:opacity-50",
    BUTTON_VARIANTS[variant],
    BUTTON_SIZES[size],
    extra,
  );
}

export function Button({
  variant,
  size,
  className,
  ...props
}: ComponentProps<"button"> & ButtonStyleProps) {
  return <button className={buttonClass({ variant, size }, className)} {...props} />;
}

export function LinkButton({
  variant,
  size,
  className,
  ...props
}: ComponentProps<typeof Link> & ButtonStyleProps) {
  return <Link className={buttonClass({ variant, size }, className)} {...props} />;
}

// ------------------------------------------------------------------- cards --

export function Card({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200 bg-white shadow-xs",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({
  title,
  description,
  action,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
      <div>
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        {description ? (
          <p className="mt-0.5 text-xs text-slate-500">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
        {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
      </div>
      {action ? <div className="flex gap-2">{action}</div> : null}
    </header>
  );
}

// ------------------------------------------------------------------ inputs --

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="field-label">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-slate-400">{hint}</span> : null}
    </label>
  );
}

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn("field-input", className)} {...props} />;
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return <select className={cn("field-input", className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn("field-input", className)} {...props} />;
}

// ------------------------------------------------------------------ outros --

const BADGE_TONES = {
  neutral: "bg-slate-100 text-slate-700 border-slate-200",
  brand: "bg-brand-50 text-brand-700 border-brand-200",
  success: "bg-emerald-50 text-emerald-700 border-emerald-200",
  warning: "bg-amber-50 text-amber-700 border-amber-200",
  danger: "bg-rose-50 text-rose-700 border-rose-200",
  info: "bg-sky-50 text-sky-700 border-sky-200",
} as const;

export function Badge({
  tone = "neutral",
  className,
  ...props
}: ComponentProps<"span"> & { tone?: keyof typeof BADGE_TONES }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        BADGE_TONES[tone],
        className,
      )}
      {...props}
    />
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-14 text-center">
      <p className="text-sm font-medium text-slate-700">{title}</p>
      {description ? <p className="max-w-sm text-sm text-slate-500">{description}</p> : null}
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}

export function Stat({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: "neutral" | "positive" | "negative" | "brand";
}) {
  const toneClass = {
    neutral: "text-slate-900",
    positive: "text-emerald-600",
    negative: "text-rose-600",
    brand: "text-brand-700",
  }[tone];

  return (
    <Card className="p-5">
      <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">{label}</p>
      <p className={cn("mt-2 text-2xl font-semibold tabular-nums", toneClass)}>{value}</p>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </Card>
  );
}

export function Alert({
  tone = "danger",
  children,
}: {
  tone?: "danger" | "success" | "info";
  children: ReactNode;
}) {
  const toneClass = {
    danger: "border-rose-200 bg-rose-50 text-rose-800",
    success: "border-emerald-200 bg-emerald-50 text-emerald-800",
    info: "border-sky-200 bg-sky-50 text-sky-800",
  }[tone];

  return (
    <div className={cn("rounded-lg border px-4 py-3 text-sm", toneClass)}>{children}</div>
  );
}
