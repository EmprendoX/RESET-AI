import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes,
} from "react";

// --- Button --------------------------------------------------

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
}) {
  const variants = {
    primary:
      "ro-accent-gradient text-white hover:brightness-110 ro-glow border border-accent/40",
    secondary:
      "bg-surface-2 text-ink hover:bg-surface-3 border border-border",
    ghost: "bg-transparent text-ink-muted hover:text-ink hover:bg-surface-2 border border-transparent",
    danger: "bg-danger/15 text-danger hover:bg-danger/25 border border-danger/30",
  };
  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2.5 text-sm",
  };
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
  );
}

// --- Inputs --------------------------------------------------

export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full rounded-xl border border-border bg-surface-2 px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint outline-none transition focus:border-accent/70 focus:ring-2 focus:ring-accent/20 ${className}`}
      {...props}
    />
  );
}

export function Textarea({
  className = "",
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`w-full rounded-xl border border-border bg-surface-2 px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint outline-none transition focus:border-accent/70 focus:ring-2 focus:ring-accent/20 ${className}`}
      {...props}
    />
  );
}

// --- Card ----------------------------------------------------

export function Card({
  children,
  className = "",
  hover = false,
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}) {
  return (
    <div className={`ro-card ${hover ? "ro-card-hover" : ""} p-5 ${className}`}>{children}</div>
  );
}

// --- Badge ---------------------------------------------------

export function Badge({
  children,
  color = "#2f7bff",
  className = "",
}: {
  children: ReactNode;
  color?: string;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${className}`}
      style={{ color, backgroundColor: `${color}1f` }}
    >
      {children}
    </span>
  );
}

// --- Checkbox (círculo) --------------------------------------

export function CheckCircle({
  checked,
  onClick,
  color = "#2f7bff",
}: {
  checked: boolean;
  onClick?: () => void;
  color?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={checked}
      className="grid h-7 w-7 shrink-0 place-items-center rounded-full border transition"
      style={{
        borderColor: checked ? color : "var(--color-border)",
        backgroundColor: checked ? color : "transparent",
      }}
    >
      {checked && (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 6 9 17l-5-5" />
        </svg>
      )}
    </button>
  );
}

// --- Anillo de progreso --------------------------------------

export function ProgressRing({
  pct,
  size = 64,
  stroke = 6,
  children,
  color = "#2f7bff",
}: {
  pct: number;
  size?: number;
  stroke?: number;
  children?: ReactNode;
  color?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.min(100, Math.max(0, pct)) / 100) * c;
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--color-surface-3)" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <div className="absolute grid place-items-center text-center">{children}</div>
    </div>
  );
}

// --- Racha (flame) -------------------------------------------

export function StreakFlame({ days, className = "" }: { days: number; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 font-semibold ${className}`}>
      <span aria-hidden>🔥</span>
      <span>{days}</span>
    </span>
  );
}

// --- Tabs ----------------------------------------------------

export function Tabs({
  items,
  active,
  onChange,
}: {
  items: { id: string; label: string }[];
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="inline-flex rounded-xl border border-border bg-surface p-1">
      {items.map((it) => (
        <button
          key={it.id}
          onClick={() => onChange(it.id)}
          className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
            active === it.id ? "bg-surface-3 text-ink" : "text-ink-muted hover:text-ink"
          }`}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}

// --- Encabezado de página ------------------------------------

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-ink-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
