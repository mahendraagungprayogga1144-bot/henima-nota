"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Button, buttonClass, EmptyState, Field, PaymentBadge, inputClass } from "@/components/ui";
import { can, scopeInvoices } from "@/lib/access";
import { formatDateTime, formatRp, invoiceTotal, waLink } from "@/lib/format";
import { useStore } from "@/lib/store";

export function InvoiceView({ id }: { id: string }) {
  const { state, cancelInvoice, returnInvoice, recordPayment, session } = useStore();
  const invoice = state.invoices.find((row) => row.id === id);

  const person = state.sales.find((s) => s.id === invoice?.salesId);
  const total = invoice ? invoiceTotal(invoice.items, invoice.discount) : 0;
  const remaining = invoice ? Math.max(0, total - invoice.paidAmount) : 0;
  const [payAmount, setPayAmount] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!invoice) return;
    const previous = document.title;
    document.title = `Nota ${invoice.number} — Henima`;
    return () => {
      document.title = previous;
    };
  }, [invoice]);

  const message = useMemo(() => {
    if (!invoice) return "";
    const lines = invoice.items.map((item) => `• ${item.name} ×${item.qty}`).join("\n");
    return `Henima Signature Scent\nNota ${invoice.number}\n${invoice.customerName}\n\n${lines}\n\nTotal ${formatRp(total)}\nStatus: ${invoice.returned ? "retur" : invoice.cancelled ? "batal" : invoice.status}\nTerima kasih.`;
  }, [invoice, total]);

  if (!invoice) {
    return (
      <EmptyState title="Nota tidak ketemu" body="Mungkin sudah di-reset, atau dibuka di browser lain." />
    );
  }

  if (session && scopeInvoices([invoice], session, state.sales).length === 0 && session.role !== "gudang") {
    return <EmptyState title="Nota ini bukan milik kamu" body="Buka nota sendiri, atau minta admin." />;
  }

  const share = waLink(invoice.customerPhone, message);

  return (
    <div>
      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link href="/nota" className="text-sm text-[#737373] hover:text-[#111111]">
          ← Daftar nota
        </Link>
        <div className="flex flex-wrap gap-2">
          {share ? (
            <a href={share} target="_blank" rel="noreferrer" className={buttonClass("ghost")}>
              Kirim WA
            </a>
          ) : null}
          <Button
            variant="ghost"
            onClick={() => {
              document.title = `Nota ${invoice.number} — Henima`;
              window.print();
            }}
          >
            Print / PDF
          </Button>
          {!invoice.cancelled && !invoice.returned && can(session, "cancel") ? (
            <Button
              variant="danger"
              onClick={() => {
                if (confirm(`Batalkan ${invoice.number}? Stok akan dikembalikan. Pakai ini kalau nota salah input.`)) {
                  cancelInvoice(invoice.id);
                }
              }}
            >
              Batalkan
            </Button>
          ) : null}
        </div>
      </div>

      <article className="print-sheet border border-[#e5e5e5] bg-white p-6 sm:p-10">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-[#e5e5e5] pb-6">
          <div>
            <p className="font-[family-name:var(--font-display)] text-2xl tracking-[0.2em] uppercase">
              Henima
            </p>
            <p className="mt-1 font-[family-name:var(--font-mono)] text-[10px] tracking-[0.16em] uppercase text-[#111111]">
              PT Henima Collection Indonesia
            </p>
          </div>
          <div className="text-right">
            <p className="font-[family-name:var(--font-mono)] text-sm text-[#111111]">{invoice.number}</p>
            <p className="mt-1 text-xs text-[#737373]">{formatDateTime(invoice.at)}</p>
            <div className="mt-2">
              <PaymentBadge status={invoice.status} cancelled={invoice.cancelled} returned={invoice.returned} />
            </div>
          </div>
        </header>

        <div className="grid gap-6 py-6 sm:grid-cols-2">
          <div>
            <p className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.14em] uppercase text-[#737373]">
              Customer
            </p>
            <p className="mt-1 text-lg">{invoice.customerName}</p>
            {invoice.customerPhone ? (
              <p className="text-sm text-[#737373]">{invoice.customerPhone}</p>
            ) : null}
          </div>
          <div>
            <p className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.14em] uppercase text-[#737373]">
              Dilayani oleh
            </p>
            <p className="mt-1">{person?.name ?? "—"}</p>
          </div>
        </div>

        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-y border-[#e5e5e5] font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.12em] text-[#737373]">
              <th className="py-2 pr-3">Item</th>
              <th className="py-2 pr-3 text-right">Qty</th>
              <th className="py-2 pr-3 text-right">Harga</th>
              <th className="py-2 text-right">Jumlah</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item) => (
              <tr key={item.productId} className="border-b border-[#e5e5e5]">
                <td className="py-3 pr-3">
                  <p>{item.name}</p>
                </td>
                <td className="py-3 pr-3 text-right tabular-nums">{item.qty}</td>
                <td className="py-3 pr-3 text-right tabular-nums">{formatRp(item.price)}</td>
                <td className="py-3 text-right tabular-nums">{formatRp(item.qty * item.price)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-6 ml-auto w-full max-w-xs space-y-2 text-sm">
          <Line label="Subtotal" value={formatRp(invoice.items.reduce((s, i) => s + i.qty * i.price, 0))} />
          <Line label="Diskon" value={formatRp(invoice.discount)} />
          <Line label="Total" value={formatRp(total)} gold />
          <Line label="Dibayar" value={formatRp(invoice.paidAmount)} />
          <Line label="Sisa" value={formatRp(remaining)} />
        </div>

        {invoice.note ? (
          <p className="mt-8 text-sm text-[#737373]">Catatan: {invoice.note}</p>
        ) : null}

        <p className="mt-10 font-[family-name:var(--font-display)] italic text-[#737373]">
          Terima kasih telah memilih Henima Signature Scent.
        </p>
      </article>

      {!invoice.cancelled && !invoice.returned && (can(session, "pay") || can(session, "retur")) ? (
        <section className="no-print mt-8 grid gap-6 lg:grid-cols-2">
          {remaining > 0 && can(session, "pay") ? (
            <div className="border border-[#e5e5e5] p-5">
              <h2 className="mb-3 font-[family-name:var(--font-mono)] text-[11px] tracking-[0.16em] uppercase text-[#737373]">
                Pelunasan
              </h2>
              <p className="mb-4 text-sm text-[#737373]">
                Sisa {formatRp(remaining)}. Catat bayaran berikutnya tanpa bikin nota baru.
              </p>
              <Field label="Jumlah">
                <input
                  className={inputClass}
                  type="number"
                  min={1}
                  value={payAmount ?? String(remaining)}
                  onChange={(e) => setPayAmount(e.target.value)}
                />
              </Field>
              {error ? <p className="mt-2 text-sm">{error}</p> : null}
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  onClick={() => {
                    setError("");
                    try {
                      recordPayment(invoice.id, Number(payAmount ?? remaining) || 0);
                      setPayAmount(null);
                    } catch (err) {
                      setError(err instanceof Error ? err.message : "Gagal mencatat bayaran");
                    }
                  }}
                >
                  Catat bayaran
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setError("");
                    try {
                      recordPayment(invoice.id, remaining, "Pelunasan penuh");
                      setPayAmount(null);
                    } catch (err) {
                      setError(err instanceof Error ? err.message : "Gagal pelunasan");
                    }
                  }}
                >
                  Lunas semua
                </Button>
              </div>
            </div>
          ) : null}

          {can(session, "retur") ? (
          <div className="border border-[#e5e5e5] p-5">
            <h2 className="mb-3 font-[family-name:var(--font-mono)] text-[11px] tracking-[0.16em] uppercase text-[#737373]">
              Retur
            </h2>
            <p className="mb-4 text-sm text-[#737373]">
              Customer mengembalikan barang. Stok masuk lagi, nota tidak dihitung di kinerja.
            </p>
            <Button
              variant="ghost"
              onClick={() => {
                if (confirm(`Retur ${invoice.number}? Semua item kembali ke stok.`)) {
                  returnInvoice(invoice.id);
                }
              }}
            >
              Retur barang
            </Button>
          </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}

function Line({ label, value, gold }: { label: string; value: string; gold?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-[#737373]">{label}</span>
      <span className={`tabular-nums ${gold ? "font-medium text-[#111111]" : ""}`}>{value}</span>
    </div>
  );
}
