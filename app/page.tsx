"use client";

import Link from "next/link";
import { useMemo } from "react";
import { can, ROLE_SOP, scopeInvoices } from "@/lib/access";
import { buttonClass, EmptyState, PageTitle, PaymentBadge, StatCard } from "@/components/ui";
import { daysAgo, formatDate, formatRp, invoiceTotal, isCountable, isToday } from "@/lib/format";
import { useStore } from "@/lib/store";

export default function DashboardPage() {
  const { state, session, cloudEnabled, resetData } = useStore();
  const { products, invoices, sales } = state;
  const mine = useMemo(
    () => scopeInvoices(invoices, session, sales),
    [invoices, session, sales],
  );

  const stats = useMemo(() => {
    const active = mine.filter(isCountable);
    const today = active.filter((inv) => isToday(inv.at));
    const omzetHari = today.reduce((sum, inv) => sum + invoiceTotal(inv.items, inv.discount), 0);
    const tunaiHari = today.reduce((sum, inv) => sum + inv.paidAmount, 0);
    const unpaid = active
      .filter((inv) => inv.status !== "lunas")
      .map((inv) => ({
        ...inv,
        remaining: invoiceTotal(inv.items, inv.discount) - inv.paidAmount,
        days: daysAgo(inv.at),
      }))
      .sort((a, b) => b.days - a.days);
    const low = products.filter((p) => p.stock <= p.minStock);
    return { today: today.length, omzetHari, tunaiHari, unpaid, low };
  }, [mine, products]);

  return (
    <div>
      <PageTitle
        kicker={session ? `${session.actorName} · ${session.role}` : "Henima"}
        title="Yang harus dikerjakan"
        subtitle={session ? ROLE_SOP[session.role] : ""}
        action={
          can(session, "nota") ? (
            <Link href="/nota/baru" className={buttonClass()}>
              Buat nota
            </Link>
          ) : can(session, "stock") ? (
            <Link href="/stok" className={buttonClass()}>
              Cek stok
            </Link>
          ) : (
            <Link href="/piutang" className={buttonClass()}>
              Cek piutang
            </Link>
          )
        }
      />

      {!cloudEnabled ? (
        <p className="mb-6 border border-[#e5e5e5] px-4 py-3 text-sm text-[#737373]">
          Data masih di laptop ini. Hubungkan server supaya tim bisa kerja dari HP atau laptop lain.{" "}
          <Link href="/setup" className="underline">
            Buka setup
          </Link>
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Nota hari ini" value={String(stats.today)} hint="Sudah dicatat" />
        <StatCard label="Omzet hari ini" value={formatRp(stats.omzetHari)} hint={`Masuk kas ${formatRp(stats.tunaiHari)}`} />
        <StatCard label="Harus ditagih" value={String(stats.unpaid.length)} hint="DP / piutang" />
        <StatCard label="Stok menipis" value={String(stats.low.length)} hint={stats.low.length ? "Restock" : "Aman"} />
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <section>
          <div className="mb-4 flex items-end justify-between">
            <h2 className="font-[family-name:var(--font-mono)] text-[11px] tracking-[0.16em] uppercase text-[#737373]">
              Tagih sekarang
            </h2>
            <Link href="/piutang" className="text-xs underline">
              Semua piutang
            </Link>
          </div>
          {stats.unpaid.length === 0 ? (
            <EmptyState title="Tidak ada tunggakan" body="Bagus. Tidak ada yang harus ditagih." />
          ) : (
            <div className="border border-[#e5e5e5]">
              {stats.unpaid.slice(0, 6).map((inv) => (
                <Link
                  key={inv.id}
                  href={`/nota/${inv.id}`}
                  className="flex items-center justify-between gap-4 border-b border-[#e5e5e5] px-4 py-3 last:border-b-0 hover:bg-[#f7f7f7]"
                >
                  <div>
                    <p className="text-sm">{inv.customerName}</p>
                    <p className="text-xs text-[#737373]">
                      {inv.number} · {inv.days} hari · {formatDate(inv.at)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="tabular-nums text-sm">{formatRp(inv.remaining)}</p>
                    <PaymentBadge status={inv.status} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="mb-4 flex items-end justify-between">
            <h2 className="font-[family-name:var(--font-mono)] text-[11px] tracking-[0.16em] uppercase text-[#737373]">
              Stok hampir habis
            </h2>
            {can(session, "stock") ? (
              <Link href="/stok" className="text-xs underline">
                Gudang
              </Link>
            ) : null}
          </div>
          {stats.low.length === 0 ? (
            <EmptyState title="Stok aman" body="Tidak ada barang di bawah batas minimum." />
          ) : (
            <div className="border border-[#e5e5e5]">
              {stats.low.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between border-b border-[#e5e5e5] px-4 py-3 last:border-b-0"
                >
                  <div>
                    <p className="text-sm">{p.name}</p>
                    <p className="text-xs text-[#737373]">Minimum {p.minStock}</p>
                  </div>
                  <p className="font-[family-name:var(--font-mono)] text-sm">
                    sisa {p.stock} {p.unit}
                  </p>
                </div>
              ))}
            </div>
          )}
          {can(session, "reset") ? (
            <button
              onClick={() => {
                if (confirm("Kosongkan semua nota, stok, dan tim di perangkat ini? Tidak bisa dibatalkan.")) {
                  resetData();
                }
              }}
              className="mt-6 text-left font-[family-name:var(--font-mono)] text-[10px] tracking-wide text-[#737373] hover:text-[#111111]"
            >
              Kosongkan semua data
            </button>
          ) : null}
        </section>
      </div>
    </div>
  );
}
