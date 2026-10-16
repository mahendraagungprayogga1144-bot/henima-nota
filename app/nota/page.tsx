"use client";

import Link from "next/link";
import { can, scopeInvoices } from "@/lib/access";
import { buttonClass, EmptyState, PageTitle, PaymentBadge } from "@/components/ui";
import { formatDate, formatRp, invoiceTotal } from "@/lib/format";
import { useStore } from "@/lib/store";

export default function NotaListPage() {
  const { state, session } = useStore();
  const invoices = scopeInvoices(state.invoices, session, state.sales);

  return (
    <div>
      <PageTitle
        kicker="Penjualan"
        title={session?.role === "sales" ? "Nota saya" : session?.role === "leader" ? "Nota tim" : "Daftar nota"}
        subtitle="Setiap nota adalah bukti jual. Jangan ada penjualan yang hanya di chat."
        action={
          can(session, "nota") ? (
            <Link href="/nota/baru" className={buttonClass()}>
              Buat nota
            </Link>
          ) : null
        }
      />

      {invoices.length === 0 ? (
        <EmptyState title="Belum ada nota" body="Setelah customer beli, catat di sini supaya stok dan kinerja ikut jalan." />
      ) : (
        <div className="overflow-x-auto border border-[#e5e5e5]">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-[#f7f7f7] font-[family-name:var(--font-mono)] text-[10px] tracking-[0.14em] uppercase text-[#737373]">
              <tr>
                <th className="px-4 py-3">Nomor</th>
                <th className="px-4 py-3">Tanggal</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Sales</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => {
                const person = state.sales.find((s) => s.id === inv.salesId);
                return (
                  <tr key={inv.id} className="border-t border-[#e5e5e5]">
                    <td className="px-4 py-3">
                      <Link href={`/nota/${inv.id}`} className="font-[family-name:var(--font-mono)] text-xs text-[#111111] hover:underline">
                        {inv.number}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-[#737373]">{formatDate(inv.at)}</td>
                    <td className="px-4 py-3">{inv.customerName}</td>
                    <td className="px-4 py-3 text-[#737373]">{person?.name ?? "—"}</td>
                    <td className={`px-4 py-3 text-right tabular-nums ${inv.cancelled || inv.returned ? "text-[#737373] line-through" : ""}`}>
                      {formatRp(invoiceTotal(inv.items, inv.discount))}
                    </td>
                    <td className="px-4 py-3">
                      <PaymentBadge status={inv.status} cancelled={inv.cancelled} returned={inv.returned} />
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
