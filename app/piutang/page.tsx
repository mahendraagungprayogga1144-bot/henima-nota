"use client";

import Link from "next/link";
import { scopeInvoices } from "@/lib/access";
import { EmptyState, PageTitle, PaymentBadge, buttonClass } from "@/components/ui";
import { daysAgo, formatDate, formatRp, invoiceTotal, isCountable, waLink } from "@/lib/format";
import { useStore } from "@/lib/store";

export default function PiutangPage() {
  const { state, session } = useStore();
  const rows = scopeInvoices(state.invoices, session, state.sales)
    .filter(isCountable)
    .filter((inv) => inv.status !== "lunas")
    .map((inv) => ({
      ...inv,
      remaining: invoiceTotal(inv.items, inv.discount) - inv.paidAmount,
      days: daysAgo(inv.at),
      salesName: state.sales.find((s) => s.id === inv.salesId)?.name ?? "—",
    }))
    .sort((a, b) => b.days - a.days);

  return (
    <div>
      <PageTitle
        kicker="Penagihan"
        title="Piutang"
        subtitle="Ini yang harus dikerjakan tanpa nunggu owner. Tagih, catat pelunasan, selesai."
      />

      {rows.length === 0 ? (
        <EmptyState title="Tidak ada piutang" body="Semua nota di cakupan kamu sudah lunas." />
      ) : (
        <div className="overflow-x-auto border border-[#e5e5e5]">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="bg-[#f7f7f7] font-[family-name:var(--font-mono)] text-[10px] tracking-[0.14em] uppercase text-[#737373]">
              <tr>
                <th className="px-4 py-3">Nota</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Sales</th>
                <th className="px-4 py-3">Umur</th>
                <th className="px-4 py-3 text-right">Sisa</th>
                <th className="px-4 py-3">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((inv) => {
                const share = waLink(
                  inv.customerPhone,
                  `Halo ${inv.customerName}, sisa pembayaran nota ${inv.number} sebesar ${formatRp(inv.remaining)}. Mohon dilunasi. Terima kasih — Henima.`,
                );
                return (
                  <tr key={inv.id} className="border-t border-[#e5e5e5]">
                    <td className="px-4 py-3">
                      <Link href={`/nota/${inv.id}`} className="font-[family-name:var(--font-mono)] text-xs hover:underline">
                        {inv.number}
                      </Link>
                      <div className="mt-1">
                        <PaymentBadge status={inv.status} />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p>{inv.customerName}</p>
                      <p className="text-xs text-[#737373]">{formatDate(inv.at)}</p>
                    </td>
                    <td className="px-4 py-3 text-[#737373]">{inv.salesName}</td>
                    <td className="px-4 py-3 tabular-nums">{inv.days} hari</td>
                    <td className="px-4 py-3 text-right tabular-nums">{formatRp(inv.remaining)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Link href={`/nota/${inv.id}`} className={buttonClass("ghost", "!px-3 !py-1.5")}>
                          Lunasi
                        </Link>
                        {share ? (
                          <a href={share} target="_blank" rel="noreferrer" className={buttonClass("ghost", "!px-3 !py-1.5")}>
                            WA
                          </a>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
