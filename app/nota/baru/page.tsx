"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { can } from "@/lib/access";
import { Button, EmptyState, Field, PageTitle, inputClass } from "@/components/ui";
import { formatRp, invoiceTotal, uniqueCustomers } from "@/lib/format";
import { useStore } from "@/lib/store";
import type { InvoiceItem, PaymentStatus } from "@/lib/types";

export default function BuatNotaPage() {
  const router = useRouter();
  const { state, createInvoice, session } = useStore();
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [salesId, setSalesId] = useState(session?.salesId ?? state.sales[0]?.id ?? "");
  const [discount, setDiscount] = useState("0");
  const [status, setStatus] = useState<PaymentStatus>("lunas");
  const [paidAmount, setPaidAmount] = useState("0");
  const [note, setNote] = useState("");
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [pickId, setPickId] = useState(state.products[0]?.id ?? "");
  const [pickQty, setPickQty] = useState("1");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const customers = useMemo(() => uniqueCustomers(state.invoices), [state.invoices]);
  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.qty * item.price, 0),
    [items],
  );
  const total = invoiceTotal(items, Number(discount) || 0);

  function addItem() {
    const product = state.products.find((p) => p.id === pickId);
    if (!product) return;
    const qty = Number(pickQty);
    if (!Number.isFinite(qty) || qty <= 0) {
      setError("Qty tidak valid.");
      return;
    }
    const existing = items.find((item) => item.productId === product.id)?.qty ?? 0;
    if (existing + qty > product.stock) {
      setError(`Stok ${product.name} hanya ${product.stock} ${product.unit}.`);
      return;
    }
    setError("");
    setItems((prev) => {
      const found = prev.find((item) => item.productId === product.id);
      if (found) {
        return prev.map((item) =>
          item.productId === product.id ? { ...item, qty: item.qty + qty } : item,
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          sku: product.sku,
          qty,
          price: product.price,
        },
      ];
    });
  }

  function submit() {
    if (saving) return;
    setError("");
    setSaving(true);
    try {
      const invoice = createInvoice({
        customerName,
        customerPhone,
        salesId,
        items,
        discount: Number(discount) || 0,
        status,
        paidAmount: Number(paidAmount) || 0,
        note,
      });
      router.push(`/nota/${invoice.id}`);
    } catch (err) {
      setSaving(false);
      setError(err instanceof Error ? err.message : "Gagal membuat nota");
    }
  }

  if (!can(session, "nota")) {
    return (
      <EmptyState
        title="Bukan tugas kamu"
        body="Buat nota hanya untuk sales dan admin."
      />
    );
  }

  return (
    <div>
      <PageTitle
        kicker="Penjualan"
        title="Buat nota"
        subtitle="Isi setelah customer beli. Stok akan terpotong saat nota disimpan."
      />

      <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <section className="border border-[#e5e5e5] bg-white p-5">
            <h2 className="mb-4 font-[family-name:var(--font-mono)] text-[11px] tracking-[0.16em] uppercase text-[#737373]">
              Customer & sales
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {customers.length > 0 ? (
                <Field label="Pelanggan lama">
                  <select
                    className={inputClass}
                    defaultValue=""
                    onChange={(e) => {
                      const picked = customers.find((c) => `${c.name}|${c.phone}` === e.target.value);
                      if (!picked) return;
                      setCustomerName(picked.name);
                      setCustomerPhone(picked.phone);
                    }}
                  >
                    <option value="">Customer baru</option>
                    {customers.map((c) => (
                      <option key={`${c.name}|${c.phone}`} value={`${c.name}|${c.phone}`}>
                        {c.name}
                        {c.phone ? ` · ${c.phone}` : ""}
                      </option>
                    ))}
                  </select>
                </Field>
              ) : null}
              <Field label="Nama customer">
                <input className={inputClass} value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Nama pembeli" />
              </Field>
              <Field label="WhatsApp">
                <input className={inputClass} value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="08…" />
              </Field>
              <Field label="Sales closing">
                {session?.role === "sales" ? (
                  <p className="border border-[#e5e5e5] px-3 py-2.5 text-sm">{session.actorName}</p>
                ) : (
                  <select className={inputClass} value={salesId} onChange={(e) => setSalesId(e.target.value)}>
                    {state.sales.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                )}
              </Field>
            </div>
          </section>

          <section className="border border-[#e5e5e5] bg-white p-5">
            <h2 className="mb-4 font-[family-name:var(--font-mono)] text-[11px] tracking-[0.16em] uppercase text-[#737373]">
              Produk
            </h2>
            <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_100px_auto]">
              <select className={inputClass} value={pickId} onChange={(e) => setPickId(e.target.value)}>
                {state.products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} · {p.size} · sisa {p.stock}
                  </option>
                ))}
              </select>
              <input
                className={inputClass}
                type="number"
                min={1}
                value={pickQty}
                onChange={(e) => setPickQty(e.target.value)}
              />
              <Button variant="ghost" type="button" onClick={addItem}>
                Tambah
              </Button>
            </div>

            {items.length === 0 ? (
              <p className="text-sm text-[#737373]">Belum ada item. Pilih produk lalu tambah.</p>
            ) : (
              <div className="space-y-2">
                {items.map((item) => (
                  <div key={item.productId} className="flex items-center justify-between gap-3 border border-[#e5e5e5] px-3 py-2">
                    <div>
                      <p className="text-sm">{item.name}</p>
                      <p className="font-[family-name:var(--font-mono)] text-[10px] text-[#737373]">
                        {item.sku} · {item.qty} × {formatRp(item.price)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="tabular-nums text-sm">{formatRp(item.qty * item.price)}</p>
                      <button
                        className="text-xs text-[#111111]"
                        onClick={() => setItems((prev) => prev.filter((row) => row.productId !== item.productId))}
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="h-fit border border-[#e5e5e5] bg-white p-5">
          <h2 className="mb-4 font-[family-name:var(--font-mono)] text-[11px] tracking-[0.16em] uppercase text-[#737373]">
            Pembayaran
          </h2>
          <Field label="Diskon">
            <input className={inputClass} type="number" min={0} value={discount} onChange={(e) => setDiscount(e.target.value)} />
          </Field>
          <div className="mt-4 flex gap-2">
            {(["lunas", "dp", "piutang"] as const).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setStatus(key)}
                className={`flex-1 border px-2 py-2 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-wider ${
                  status === key ? "border-[#111111] bg-[#111111] text-white" : "border-[#e5e5e5] text-[#737373]"
                }`}
              >
                {key}
              </button>
            ))}
          </div>
          {status === "dp" ? (
            <div className="mt-4">
              <Field label="Jumlah DP">
                <input className={inputClass} type="number" min={0} value={paidAmount} onChange={(e) => setPaidAmount(e.target.value)} />
              </Field>
            </div>
          ) : null}

          <Field label="Catatan">
            <textarea className={`${inputClass} mt-4 min-h-20`} value={note} onChange={(e) => setNote(e.target.value)} />
          </Field>

          <div className="mt-6 space-y-2 border-t border-[#e5e5e5] pt-4 text-sm">
            <Row label="Subtotal" value={formatRp(subtotal)} />
            <Row label="Diskon" value={formatRp(Number(discount) || 0)} />
            <Row label="Total" value={formatRp(total)} strong />
          </div>

          {error ? <p className="mt-4 text-sm text-[#111111]">{error}</p> : null}

          <Button className="mt-5 w-full" onClick={submit} disabled={items.length === 0 || saving}>
            {saving ? "Menyimpan…" : "Simpan nota"}
          </Button>
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-[#737373]">{label}</span>
      <span className={`tabular-nums ${strong ? "font-medium text-[#111111]" : ""}`}>{value}</span>
    </div>
  );
}
