"use client";

import { useMemo, useState } from "react";
import {
  Button,
  EmptyState,
  Field,
  Modal,
  MovementBadge,
  PageTitle,
  inputClass,
} from "@/components/ui";
import { can } from "@/lib/access";
import { formatDateTime, formatRp } from "@/lib/format";
import { useStore } from "@/lib/store";

type ModalKind = "masuk" | "keluar" | "produk" | null;

export default function StokPage() {
  const { state, session, addStock, removeStock, addProduct } = useStore();
  const [modal, setModal] = useState<ModalKind>(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    productId: "",
    qty: "1",
    note: "",
    sku: "",
    name: "",
    size: "50ml",
    unit: "botol",
    stock: "0",
    minStock: "5",
    price: "189000",
  });

  const productMap = useMemo(
    () => Object.fromEntries(state.products.map((p) => [p.id, p])),
    [state.products],
  );

  function close() {
    setModal(null);
    setError("");
  }

  function submitMove() {
    setError("");
    try {
      const qty = Number(form.qty);
      if (modal === "masuk") addStock(form.productId, qty, form.note);
      if (modal === "keluar") removeStock(form.productId, qty, form.note);
      close();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan");
    }
  }

  function submitProduct() {
    setError("");
    try {
      addProduct({
        sku: form.sku,
        name: form.name,
        size: form.size,
        unit: form.unit,
        stock: Number(form.stock),
        minStock: Number(form.minStock),
        price: Number(form.price),
      });
      close();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menambah produk");
    }
  }

  return (
    <div>
      <PageTitle
        kicker="Gudang"
        title="Stok barang"
        subtitle="Stok terpotong otomatis saat nota dibuat. Barang masuk dan opname tetap dicatat di sini."
        action={
          can(session, "stock") ? (
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" onClick={() => { setForm((f) => ({ ...f, productId: state.products[0]?.id ?? "", qty: "1", note: "" })); setModal("keluar"); }}>
              Keluar
            </Button>
            <Button variant="ghost" onClick={() => { setForm((f) => ({ ...f, productId: state.products[0]?.id ?? "", qty: "10", note: "Restock" })); setModal("masuk"); }}>
              Masuk
            </Button>
            <Button onClick={() => { setForm((f) => ({ ...f, sku: "", name: "", stock: "0" })); setModal("produk"); }}>
              Produk baru
            </Button>
          </div>
          ) : undefined
        }
      />

      <div className="overflow-x-auto border border-[#e5e5e5]">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-[#f7f7f7] font-[family-name:var(--font-mono)] text-[10px] tracking-[0.14em] uppercase text-[#737373]">
            <tr>
              <th className="px-4 py-3">SKU</th>
              <th className="px-4 py-3">Produk</th>
              <th className="px-4 py-3">Ukuran</th>
              <th className="px-4 py-3 text-right">Harga</th>
              <th className="px-4 py-3 text-right">Stok</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {state.products.map((p) => {
              const low = p.stock <= p.minStock;
              return (
                <tr key={p.id} className="border-t border-[#e5e5e5]">
                  <td className="px-4 py-3 font-[family-name:var(--font-mono)] text-xs text-[#737373]">
                    {p.sku}
                  </td>
                  <td className="px-4 py-3">{p.name}</td>
                  <td className="px-4 py-3 text-[#737373]">
                    {p.size} · {p.unit}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatRp(p.price)}</td>
                  <td className={`px-4 py-3 text-right tabular-nums ${low ? "text-[#111111]" : ""}`}>
                    {p.stock}
                  </td>
                  <td className="px-4 py-3">
                    {low ? (
                      <span className="font-[family-name:var(--font-mono)] text-[10px] font-semibold uppercase tracking-wider text-[#111111]">
                        Menipis
                      </span>
                    ) : (
                      <span className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-wider text-[#737373]">
                        Aman
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <h2 className="mt-10 mb-4 font-[family-name:var(--font-mono)] text-[11px] tracking-[0.16em] uppercase text-[#737373]">
        Mutasi stok
      </h2>
      {state.movements.length === 0 ? (
        <EmptyState title="Belum ada mutasi" body="Nota, barang masuk, dan barang keluar akan muncul di sini." />
      ) : (
        <div className="overflow-x-auto border border-[#e5e5e5]">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-[#f7f7f7] font-[family-name:var(--font-mono)] text-[10px] tracking-[0.14em] uppercase text-[#737373]">
              <tr>
                <th className="px-4 py-3">Waktu</th>
                <th className="px-4 py-3">Tipe</th>
                <th className="px-4 py-3">Produk</th>
                <th className="px-4 py-3 text-right">Qty</th>
                <th className="px-4 py-3">Catatan</th>
              </tr>
            </thead>
            <tbody>
              {state.movements.slice(0, 30).map((m) => (
                <tr key={m.id} className="border-t border-[#e5e5e5]">
                  <td className="px-4 py-3 text-xs text-[#737373]">{formatDateTime(m.at)}</td>
                  <td className="px-4 py-3">
                    <MovementBadge type={m.type} />
                  </td>
                  <td className="px-4 py-3">{productMap[m.productId]?.name ?? m.productId}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{m.qty}</td>
                  <td className="px-4 py-3 text-[#737373]">{m.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal === "masuk" || modal === "keluar" ? (
        <Modal title={modal === "masuk" ? "Barang masuk" : "Barang keluar"} onClose={close}>
          <div className="space-y-3">
            <Field label="Produk">
              <select
                className={inputClass}
                value={form.productId}
                onChange={(e) => setForm((f) => ({ ...f, productId: e.target.value }))}
              >
                {state.products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} · sisa {p.stock}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Jumlah">
              <input
                className={inputClass}
                type="number"
                min={1}
                value={form.qty}
                onChange={(e) => setForm((f) => ({ ...f, qty: e.target.value }))}
              />
            </Field>
            <Field label="Catatan">
              <input
                className={inputClass}
                value={form.note}
                onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                placeholder="Restock / rusak / sample"
              />
            </Field>
            {error ? <p className="text-sm text-[#111111]">{error}</p> : null}
            <Button className="w-full" onClick={submitMove}>
              Simpan
            </Button>
          </div>
        </Modal>
      ) : null}

      {modal === "produk" ? (
        <Modal title="Produk baru" onClose={close}>
          <div className="space-y-3">
            <Field label="SKU">
              <input className={inputClass} value={form.sku} onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))} placeholder="HEN-XXXX" />
            </Field>
            <Field label="Nama">
              <input className={inputClass} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Ukuran">
                <input className={inputClass} value={form.size} onChange={(e) => setForm((f) => ({ ...f, size: e.target.value }))} />
              </Field>
              <Field label="Satuan">
                <input className={inputClass} value={form.unit} onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Stok awal">
                <input className={inputClass} type="number" value={form.stock} onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))} />
              </Field>
              <Field label="Min. stok">
                <input className={inputClass} type="number" value={form.minStock} onChange={(e) => setForm((f) => ({ ...f, minStock: e.target.value }))} />
              </Field>
            </div>
            <Field label="Harga jual">
              <input className={inputClass} type="number" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} />
            </Field>
            {error ? <p className="text-sm text-[#111111]">{error}</p> : null}
            <Button className="w-full" onClick={submitProduct}>
              Simpan produk
            </Button>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
