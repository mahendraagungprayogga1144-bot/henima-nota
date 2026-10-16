"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { isAllowedPath, navFor, ROLE_LABEL } from "@/lib/access";
import { useStore } from "@/lib/store";
import { Gate } from "./gate";

const BARE_PATHS = ["/masuk", "/daftar", "/setup"];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { ready, session, cloudEnabled, signOut } = useStore();
  const [open, setOpen] = useState(false);
  const nav = session ? navFor(session.role) : [];
  const leaveLabel = cloudEnabled ? "Keluar" : "Ganti petugas";

  if (BARE_PATHS.includes(pathname)) {
    return <div className="min-h-full bg-white text-[#111111]">{children}</div>;
  }

  return (
    <Gate>
      <div className="min-h-full bg-white text-[#111111]">
        <aside className="no-print fixed inset-y-0 left-0 z-40 hidden w-60 border-r border-[#e5e5e5] bg-white md:flex md:flex-col">
          <Brand />
          <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
            {nav.map((item) => (
              <NavLink key={item.href} {...item} active={isActive(pathname, item.href)} />
            ))}
          </nav>
          <div className="border-t border-[#e5e5e5] px-5 py-4">
            <p className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-wider text-[#737373]">
              {session ? ROLE_LABEL[session.role] : ""}
            </p>
            <p className="mt-1 text-sm">{session?.actorName}</p>
            <button
              onClick={signOut}
              className="mt-3 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-wider text-[#737373] hover:text-[#111111]"
            >
              {leaveLabel}
            </button>
          </div>
        </aside>

        <header className="no-print sticky top-0 z-30 flex items-center justify-between border-b border-[#e5e5e5] bg-white/90 px-4 py-3 backdrop-blur md:hidden">
          <Brand compact />
          <button
            onClick={() => setOpen((v) => !v)}
            className="border border-[#111111] px-3 py-1.5 font-[family-name:var(--font-mono)] text-[10px] tracking-[0.14em] uppercase text-[#111111]"
          >
            Menu
          </button>
        </header>

        {open ? (
          <div className="fixed inset-0 z-40 bg-black/30 md:hidden" onClick={() => setOpen(false)}>
            <nav
              className="absolute right-0 top-0 flex h-full w-64 flex-col gap-1 border-l border-[#e5e5e5] bg-white px-3 py-6"
              onClick={(e) => e.stopPropagation()}
            >
              {nav.map((item) => (
                <NavLink
                  key={item.href}
                  {...item}
                  active={isActive(pathname, item.href)}
                  onClick={() => setOpen(false)}
                />
              ))}
              <button
                onClick={() => {
                  setOpen(false);
                  signOut();
                }}
                className="mt-4 px-3 text-left font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-wider text-[#737373]"
              >
                {leaveLabel}
              </button>
            </nav>
          </div>
        ) : null}

        <main className="md:pl-60">
          <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8">
            {!ready ? (
              <p className="text-sm text-[#737373]">Memuat data lokal…</p>
            ) : session && !isAllowedPath(pathname, session.role) ? (
              <div>
                <p className="font-[family-name:var(--font-display)] text-2xl">Bukan tugas kamu</p>
                <p className="mt-2 text-sm text-[#737373]">
                  Menu ini untuk peran lain. Kembali ke hari ini, kerjakan yang di depanmu.
                </p>
                <Link href="/" className="mt-4 inline-block underline">
                  Ke hari ini
                </Link>
              </div>
            ) : (
              children
            )}
          </div>
        </main>
      </div>
    </Gate>
  );
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`px-5 ${compact ? "" : "border-b border-[#e5e5e5] py-6"}`}>
      <p className="font-[family-name:var(--font-display)] text-xl tracking-[0.22em] uppercase text-[#111111]">
        Henima
      </p>
      {compact ? null : (
        <p className="mt-1 font-[family-name:var(--font-mono)] text-[10px] tracking-[0.16em] uppercase text-[#737373]">
          Operasi harian
        </p>
      )}
    </div>
  );
}

function NavLink({
  href,
  label,
  active,
  onClick,
}: {
  href: string;
  label: string;
  active: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`px-3 py-2.5 font-[family-name:var(--font-mono)] text-[11px] tracking-[0.12em] uppercase transition ${
        active
          ? "bg-[#111111] text-white"
          : "text-[#737373] hover:bg-[#f7f7f7] hover:text-[#111111]"
      }`}
    >
      {label}
    </Link>
  );
}

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  if (href === "/nota") return pathname === "/nota" || /^\/nota\/(?!baru).+/.test(pathname);
  return pathname === href || pathname.startsWith(`${href}/`);
}
