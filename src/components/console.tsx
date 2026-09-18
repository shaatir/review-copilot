import type { ButtonHTMLAttributes, ReactNode } from "react";

export function PageHeader({
  title,
  description,
  extra,
}: {
  title: ReactNode;
  description?: ReactNode;
  extra?: ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-[20px] font-normal tracking-tight text-ink">{title}</h1>
        {description ? (
          <p className="mt-1 max-w-3xl text-[13px] leading-5 text-muted">
            {description}
          </p>
        ) : null}
      </div>
      {extra ? <div className="flex flex-wrap items-center gap-2">{extra}</div> : null}
    </div>
  );
}

export function Container({
  header,
  headerExtra,
  children,
  noPad = false,
  className = "",
}: {
  header?: ReactNode;
  headerExtra?: ReactNode;
  children: ReactNode;
  noPad?: boolean;
  className?: string;
}) {
  return (
    <section
      className={`border border-line bg-panel shadow-[0_1px_1px_0_rgba(0,28,36,0.3)] ${className}`}
    >
      {header ? (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-2.5">
          <h2 className="text-[16px] font-bold text-ink">{header}</h2>
          {headerExtra ? (
            <div className="text-[12px] text-muted">{headerExtra}</div>
          ) : null}
        </div>
      ) : null}
      <div className={noPad ? "" : "p-4"}>{children}</div>
    </section>
  );
}

export function Button({
  variant = "normal",
  className = "",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "normal" | "link";
}) {
  const tones = {
    primary:
      "border-orange bg-orange font-bold text-white hover:border-orange-hover hover:bg-orange-hover",
    normal:
      "border-line-strong bg-panel font-bold text-ink hover:bg-row-alt",
    link: "border-transparent bg-transparent font-normal text-blue hover:text-blue-hover hover:underline",
  };
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-[2px] border px-3 py-1.5 text-[13px] disabled:cursor-not-allowed disabled:opacity-50 ${tones[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Flashbar({
  type = "info",
  children,
}: {
  type?: "info" | "warning" | "success";
  children: ReactNode;
}) {
  const tones = {
    info: "border-l-blue bg-[#f1faff]",
    warning: "border-l-[#d9a300] bg-[#fdf6e3]",
    success: "border-l-official bg-success-dim",
  };
  return (
    <div
      className={`border border-line border-l-4 px-3 py-2 text-[13px] leading-5 text-ink ${tones[type]}`}
    >
      {children}
    </div>
  );
}

export function KeyValuePairs({
  items,
  columns = 4,
}: {
  items: Array<{ label: string; value: ReactNode }>;
  columns?: 2 | 3 | 4;
}) {
  const cols =
    columns === 2
      ? "sm:grid-cols-2"
      : columns === 3
        ? "sm:grid-cols-2 lg:grid-cols-3"
        : "sm:grid-cols-2 lg:grid-cols-4";
  return (
    <dl className={`grid grid-cols-1 gap-x-6 gap-y-3 ${cols}`}>
      {items.map((item) => (
        <div key={item.label} className="min-w-0">
          <dt className="micro-label">{item.label}</dt>
          <dd className="mt-0.5 break-all text-[13px] text-ink">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function StatTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: ReactNode;
  tone?: "approve" | "watch" | "reject";
}) {
  const color =
    tone === "approve"
      ? "text-approve"
      : tone === "watch"
        ? "text-watch"
        : tone === "reject"
          ? "text-reject"
          : "text-ink";
  return (
    <div className="border border-line bg-panel px-3 py-2 shadow-[0_1px_1px_0_rgba(0,28,36,0.15)]">
      <div className="micro-label">{label}</div>
      <div className={`mt-0.5 font-mono text-[16px] font-semibold ${color}`}>
        {value}
      </div>
    </div>
  );
}
