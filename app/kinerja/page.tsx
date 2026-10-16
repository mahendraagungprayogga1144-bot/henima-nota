"use client";

import { useMemo, useState } from "react";
import { EmptyState, PageTitle, StatCard } from "@/components/ui";
import { scopeInvoices } from "@/lib/access";
import { formatRp, invoiceTotal, sameMonth, isCountable } from "@/lib/format";
import { useStore } from "@/lib/store";

export default function KinerjaPage() {
  const { state, session } = useStore();
  const [period, setPeriod] = useState<"bulan" | "semua">("bulan");
  const visibleSales =
    session?.role === "sales"
      ? state.sales.filter((s) => s.id === session.salesId)
      : session?.role === "leader"
        ? state.sales.filter((s) => s.leaderId === session.leaderId)
        : state.sales;

  const rows = useMemo(() => {
    const active = scopeInvoices(state.invoices, session, state.sales).filter(isCountable);
    const scoped = period === "bulan" ? active.filter((inv) => sameMonth(inv.at)) : active;

    return visibleSales.map((person) => {
      const mine = scoped.filter((inv) => inv.salesId === person.id);
      const omzet = mine.reduce((sum, inv) => sum + invoiceTotal(inv.items, inv.discount), 0);
      const qty = mine.reduce((sum, inv) => sum + inv.items.reduce((n, item) => n + item.qty, 0), 0);
      const lunas = mine.filter((inv) => inv.status === "lunas").length;
      const leader = state.leaders.find((l) => l.id === person.leaderId);
      return {
        ...person,
        leaderName: leader?.name ?? "Counter / tanpa leader",
        nota: mine.length,
        omzet,
        qty,
        lunas,
      };
    });
  }, [period, session, state.invoices, state.leaders, state.sales, visibleSales]);

  const leaders = useMemo(() => {
    const map = new Map<string, { name: string; omzet: number; nota: number; qty: number }>();
    for (const row of rows) {
      const key = row.leaderId ?? "none";
      const current = map.get(key) ?? { name: row.leaderName, omzet: 0, nota: 0, qty: 0 };
      current.omzet += row.omzet;
      current.nota += row.nota;
      current.qty += row.qty;
      map.set(key, current);
    }
    return [...map.values()].sort((a, b) => b.omzet - a.omzet);
  }, [rows]);

  const totalOmzet = rows.reduce((sum, row) => sum + row.omzet, 0);
  const totalNota = rows.reduce((sum, row) => sum + row.nota, 0);
  const ranked = [...rows].sort((a, b) => b.omzet - a.omzet);

  return (
    <div>
      <PageTitle
        kicker="Sales"
        title="Kinerja"
        subtitle="Angka dihitung dari nota yang sudah disimpan. Nota batal tidak masuk omzet."
        action={
          <div className="flex border border-[#e5e5e5]">
            <button
              className={`px-4 py-2 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-wider ${period === "bulan" ? "bg-[#111111] text-white" : "text-[#737373]"}`}
              onClick={() => setPeriod("bulan")}
            >
              Bulan ini
            </button>
            <button
              className={`px-4 py-2 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-wider ${period === "semua" ? "bg-[#111111] text-white" : "text-[#737373]"}`}
              onClick={() => setPeriod("semua")}
            >
              Semua
            </button>
          </div>
        }
      />

      <div className="mb-8 grid gap-3 sm:grid-cols-2">
        <StatCard label="Omzet periode" value={formatRp(totalOmzet)} hint={`${totalNota} nota aktif`} />
        <StatCard
          label="Teratas"
          value={ranked[0]?.omzet ? ranked[0].name : "—"}
          hint={ranked[0]?.omzet ? formatRp(ranked[0].omzet) : "Belum ada penjualan"}
        />
      </div>

      <h2 className="mb-4 font-[family-name:var(--font-mono)] text-[11px] tracking-[0.16em] uppercase text-[#737373]">
        Per sales
      </h2>
      {ranked.length === 0 ? (
        <EmptyState title="Belum ada sales" body="Tambah tim di menu Tim Sales. Omzet muncul setelah ada nota." />
      ) : (
      <div className="mb-10 overflow-x-auto border border-[#e5e5e5]">
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead className="bg-[#f7f7f7] font-[family-name:var(--font-mono)] text-[10px] tracking-[0.14em] uppercase text-[#737373]">
            <tr>
              <th className="px-4 py-3">Sales</th>
              <th className="px-4 py-3">Leader</th>
              <th className="px-4 py-3 text-right">Nota</th>
              <th className="px-4 py-3 text-right">Qty</th>
              <th className="px-4 py-3 text-right">Lunas</th>
              <th className="px-4 py-3 text-right">Omzet</th>
            </tr>
          </thead>
          <tbody>
            {ranked.map((row) => (
              <tr key={row.id} className="border-t border-[#e5e5e5]">
                <td className="px-4 py-3">{row.name}</td>
                <td className="px-4 py-3 text-[#737373]">{row.leaderName}</td>
                <td className="px-4 py-3 text-right tabular-nums">{row.nota}</td>
                <td className="px-4 py-3 text-right tabular-nums">{row.qty}</td>
                <td className="px-4 py-3 text-right tabular-nums">{row.lunas}</td>
                <td className="px-4 py-3 text-right tabular-nums text-[#111111]">{formatRp(row.omzet)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}

      <h2 className="mb-4 font-[family-name:var(--font-mono)] text-[11px] tracking-[0.16em] uppercase text-[#737373]">
        Per leader
      </h2>
      {leaders.length === 0 ? (
        <EmptyState title="Belum ada angka leader" body="Muncul setelah ada sales dan nota." />
      ) : (
      <div className="overflow-x-auto border border-[#e5e5e5]">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead className="bg-[#f7f7f7] font-[family-name:var(--font-mono)] text-[10px] tracking-[0.14em] uppercase text-[#737373]">
            <tr>
              <th className="px-4 py-3">Leader / kanal</th>
              <th className="px-4 py-3 text-right">Nota</th>
              <th className="px-4 py-3 text-right">Qty</th>
              <th className="px-4 py-3 text-right">Omzet</th>
            </tr>
          </thead>
          <tbody>
            {leaders.map((row) => (
              <tr key={row.name} className="border-t border-[#e5e5e5]">
                <td className="px-4 py-3">{row.name}</td>
                <td className="px-4 py-3 text-right tabular-nums">{row.nota}</td>
                <td className="px-4 py-3 text-right tabular-nums">{row.qty}</td>
                <td className="px-4 py-3 text-right tabular-nums text-[#111111]">{formatRp(row.omzet)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}
    </div>
  );
}
