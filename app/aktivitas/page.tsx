"use client";

import { EmptyState, PageTitle } from "@/components/ui";
import { formatDateTime } from "@/lib/format";
import { useStore } from "@/lib/store";

export default function AktivitasPage() {
  const { state } = useStore();
  const rows = state.activities ?? [];

  return (
    <div>
      <PageTitle
        kicker="Audit"
        title="Aktivitas"
        subtitle="Siapa yang input apa. Kalau ada yang aneh, ketahuan tanpa harus tanya owner."
      />

      {rows.length === 0 ? (
        <EmptyState title="Belum ada jejak" body="Setiap nota, pelunasan, stok, dan retur akan tercatat di sini." />
      ) : (
        <div className="overflow-x-auto border border-[#e5e5e5]">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-[#f7f7f7] font-[family-name:var(--font-mono)] text-[10px] tracking-[0.14em] uppercase text-[#737373]">
              <tr>
                <th className="px-4 py-3">Waktu</th>
                <th className="px-4 py-3">Petugas</th>
                <th className="px-4 py-3">Aksi</th>
                <th className="px-4 py-3">Detail</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-[#e5e5e5]">
                  <td className="px-4 py-3 text-xs text-[#737373]">{formatDateTime(row.at)}</td>
                  <td className="px-4 py-3">
                    <p>{row.actor}</p>
                    <p className="font-[family-name:var(--font-mono)] text-[10px] uppercase text-[#737373]">{row.role}</p>
                  </td>
                  <td className="px-4 py-3">{row.action}</td>
                  <td className="px-4 py-3 text-[#737373]">{row.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
