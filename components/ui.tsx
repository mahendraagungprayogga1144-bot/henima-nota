"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import type { MovementType, PaymentStatus } from "@/lib/types";

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="font-[family-name:var(--font-mono)] text-[11px] tracking-[0.18em] uppercase text-[#737373]">
      {children}
    </p>
  );
}

export function PageTitle({
  kicker,
  title,
  subtitle,
  action,
}: {
  kicker: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <Eyebrow>{kicker}</Eyebrow>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-[32px] leading-none tracking-[-0.02em] text-[#111111]">
          {title}
        </h1>
        {subtitle ? <p className="mt-2 max-w-xl text-sm text-[#737373]">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="border border-[#e5e5e5] bg-white px-5 py-4">
      <p className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.16em] uppercase text-[#737373]">
        {label}
      </p>
      <p className="mt-2 font-[family-name:var(--font-display)] text-[26px] leading-none text-[#111111] tabular-nums">
        {value}
      </p>
      {hint ? <p className="mt-2 text-xs text-[#737373]">{hint}</p> : null}
    </div>
  );
}

export function PaymentBadge({
  status,
  cancelled,
  returned,
}: {
  status: PaymentStatus;
  cancelled?: boolean;
  returned?: boolean;
}) {
  if (returned) {
    return (
      <span className="inline-flex border border-[#e5e5e5] px-2 py-0.5 font-[family-name:var(--font-mono)] text-[10px] tracking-[0.12em] uppercase text-[#737373]">
        Retur
      </span>
    );
  }
  if (cancelled) {
    return (
      <span className="inline-flex border border-[#e5e5e5] px-2 py-0.5 font-[family-name:var(--font-mono)] text-[10px] tracking-[0.12em] uppercase text-[#737373]">
        Batal
      </span>
    );
  }
  const map = {
    lunas: "bg-[#111111] text-white border-[#111111]",
    dp: "border-[#111111] text-[#111111]",
    piutang: "border-[#e5e5e5] text-[#737373]",
  } as const;
  return (
    <span
      className={`inline-flex border px-2 py-0.5 font-[family-name:var(--font-mono)] text-[10px] tracking-[0.12em] uppercase ${map[status]}`}
    >
      {status}
    </span>
  );
}

export function MovementBadge({ type }: { type: MovementType }) {
  const filled = type === "nota" || type === "keluar";
  return (
    <span
      className={`inline-flex border px-2 py-0.5 font-[family-name:var(--font-mono)] text-[10px] tracking-[0.12em] uppercase ${
        filled ? "border-[#111111] bg-[#111111] text-white" : "border-[#111111] text-[#111111]"
      }`}
    >
      {type}
    </span>
  );
}

const buttonStyles = {
  gold: "bg-[#111111] text-white hover:bg-black",
  ghost: "border border-[#111111] text-[#111111] hover:bg-[#111111] hover:text-white",
  danger: "border border-[#111111] text-[#111111] hover:bg-[#111111] hover:text-white",
} as const;

export function buttonClass(variant: keyof typeof buttonStyles = "gold", className = "") {
  return `inline-flex items-center justify-center gap-2 px-4 py-2.5 font-[family-name:var(--font-mono)] text-[11px] tracking-[0.14em] uppercase transition disabled:cursor-not-allowed disabled:opacity-40 ${buttonStyles[variant]} ${className}`;
}

export function Button({
  children,
  variant = "gold",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof buttonStyles;
}) {
  return (
    <button className={buttonClass(variant, className)} {...props}>
      {children}
    </button>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-[family-name:var(--font-mono)] text-[10px] tracking-[0.14em] uppercase text-[#737373]">
        {label}
      </span>
      {children}
    </label>
  );
}

export const inputClass =
  "w-full border border-[#e5e5e5] bg-white px-3 py-2.5 text-sm text-[#111111] outline-none placeholder:text-[#a3a3a3] focus:border-[#111111]";

export function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md border border-[#e5e5e5] bg-white p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <h2 className="font-[family-name:var(--font-display)] text-xl text-[#111111]">{title}</h2>
          <button
            onClick={onClose}
            className="text-[#737373] hover:text-[#111111]"
            aria-label="Tutup"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="border border-dashed border-[#e5e5e5] px-6 py-12 text-center">
      <p className="font-[family-name:var(--font-display)] text-lg text-[#111111]">{title}</p>
      <p className="mt-2 text-sm text-[#737373]">{body}</p>
    </div>
  );
}
