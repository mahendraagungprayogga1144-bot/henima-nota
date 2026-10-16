const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

export function formatRp(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${formatDate(iso)} · ${hh}:${mm}`;
}

export function invoiceTotal(items: { qty: number; price: number }[], discount: number): number {
  const sub = items.reduce((sum, item) => sum + item.qty * item.price, 0);
  return Math.max(0, sub - discount);
}

export function nextInvoiceNumber(existing: { number: string }[], at = new Date()): string {
  const year = at.getFullYear();
  const prefix = `HNM-${year}-`;
  const seqs = existing
    .map((row) => row.number)
    .filter((number) => number.startsWith(prefix))
    .map((number) => Number.parseInt(number.slice(prefix.length), 10))
    .filter((n) => Number.isFinite(n));
  const next = (seqs.length ? Math.max(...seqs) : 0) + 1;
  return `${prefix}${String(next).padStart(4, "0")}`;
}

export function waLink(phone: string, text: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 8) return null;
  const normalized = digits.startsWith("0") ? `62${digits.slice(1)}` : digits;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(text)}`;
}

export function isCountable(invoice: { cancelled: boolean; returned?: boolean }): boolean {
  return !invoice.cancelled && !invoice.returned;
}

export function uniqueCustomers(
  invoices: {
    customerName: string;
    customerPhone: string;
    cancelled: boolean;
    returned?: boolean;
    items: { qty: number; price: number }[];
    discount: number;
  }[],
) {
  const map = new Map<
    string,
    { name: string; phone: string; nota: number; omzet: number }
  >();
  for (const inv of invoices) {
    if (!isCountable(inv)) continue;
    const phone = inv.customerPhone.trim();
    const name = inv.customerName.trim();
    const key = (phone || name).toLowerCase();
    if (!key) continue;
    const current = map.get(key) ?? { name, phone, nota: 0, omzet: 0 };
    current.nota += 1;
    current.omzet += invoiceTotal(inv.items, inv.discount);
    if (name) current.name = name;
    if (phone) current.phone = phone;
    map.set(key, current);
  }
  return [...map.values()].sort((a, b) => b.omzet - a.omzet);
}

export function sameMonth(iso: string, ref = new Date()): boolean {
  const d = new Date(iso);
  return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth();
}

export function isToday(iso: string, ref = new Date()): boolean {
  const d = new Date(iso);
  return (
    d.getFullYear() === ref.getFullYear() &&
    d.getMonth() === ref.getMonth() &&
    d.getDate() === ref.getDate()
  );
}

export function daysAgo(iso: string, ref = new Date()): number {
  const d = new Date(iso);
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const now = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate()).getTime();
  return Math.max(0, Math.round((now - start) / 86400000));
}
