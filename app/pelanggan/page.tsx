"use client";

import Link from "next/link";
import { EmptyState, PageTitle } from "@/components/ui";
import { scopeInvoices } from "@/lib/access";
import { formatRp, uniqueCustomers } from "@/lib/format";
import { useStore } from "@/lib/store";

export default function PelangganPage() {
  const { state, session } = useStore();
  const customers = uniqueCustomers(scopeInvoices(state.invoices, session, state.sales));

  return (
    <div>
      <PageTitle
        kicker="CRM"
        title="Pelanggan"
        subtitle="Terisi otomatis dari nota. Pilih nama yang sama saat buat nota berikutnya."
      />

      {customers.length === 0 ? (
        <EmptyState title="Belum ada pelanggan" body="Buat nota pertama, nama customer akan muncul di sini." />
      ) : (
        <div className="overflow-x-auto border border-[#e5e5e5]">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-[#f7f7f7] font-[family-name:var(--font-mono)] text-[10px] tracking-[0.14em] uppercase text-[#737373]">
              <tr>
                <th className="px-4 py-3">Nama</th>
                <th className="px-4 py-3">WhatsApp</th>
                <th className="px-4 py-3 text-right">Nota</th>
                <th className="px-4 py-3 text-right">Omzet</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={`${c.name}|${c.phone}`} className="border-t border-[#e5e5e5]">
                  <td className="px-4 py-3">{c.name}</td>
                  <td className="px-4 py-3 text-[#737373]">
                    {c.phone ? (
                      <a className="hover:underline" href={`https://wa.me/${c.phone.replace(/\D/g, "").replace(/^0/, "62")}`}>
                        {c.phone}
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{c.nota}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatRp(c.omzet)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-6 text-sm text-[#737373]">
        Buat nota untuk pelanggan lama lewat{" "}
        <Link href="/nota/baru" className="underline">
          Buat Nota
        </Link>
        .
      </p>
    </div>
  );
}
