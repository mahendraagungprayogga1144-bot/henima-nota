import type { Invoice, Role, SalesPerson, Session } from "./types";

export const ROLE_LABEL: Record<Role, string> = {
  admin: "Admin",
  gudang: "Gudang",
  sales: "Sales",
  leader: "Leader",
};

export const ROLE_SOP: Record<Role, string> = {
  admin: "Setiap pagi: tagih yang belum lunas, cek stok menipis, lihat aktivitas tim. Keputusan besar boleh nunggu kamu; kerjaan harian tidak.",
  gudang: "Barang datang → catat masuk. Jangan serahkan barang tanpa catatan keluar.",
  sales: "Customer deal → buat nota sekarang. Jangan jual tanpa nota. DP ditagih sampai lunas.",
  leader: "Pantau nota dan piutang anak tim. Yang nunggak lebih dari 3 hari ditagih hari ini.",
};

export type NavItem = { href: string; label: string };

export function navFor(role: Role): NavItem[] {
  if (role === "gudang") {
    return [
      { href: "/", label: "Hari ini" },
      { href: "/stok", label: "Stok Barang" },
      { href: "/aktivitas", label: "Aktivitas" },
    ];
  }
  if (role === "sales") {
    return [
      { href: "/", label: "Hari ini" },
      { href: "/nota/baru", label: "Buat Nota" },
      { href: "/nota", label: "Nota saya" },
      { href: "/piutang", label: "Tagihan" },
      { href: "/pelanggan", label: "Pelanggan" },
      { href: "/kinerja", label: "Kinerja" },
    ];
  }
  if (role === "leader") {
    return [
      { href: "/", label: "Hari ini" },
      { href: "/nota", label: "Nota tim" },
      { href: "/piutang", label: "Piutang tim" },
      { href: "/pelanggan", label: "Pelanggan" },
      { href: "/kinerja", label: "Kinerja" },
      { href: "/aktivitas", label: "Aktivitas" },
    ];
  }
  return [
    { href: "/", label: "Hari ini" },
    { href: "/nota/baru", label: "Buat Nota" },
    { href: "/nota", label: "Daftar Nota" },
    { href: "/piutang", label: "Piutang" },
    { href: "/stok", label: "Stok Barang" },
    { href: "/pelanggan", label: "Pelanggan" },
    { href: "/tim", label: "Tim Sales" },
    { href: "/kinerja", label: "Kinerja" },
    { href: "/aktivitas", label: "Aktivitas" },
  ];
}

export function can(session: Session | null, action: "nota" | "pay" | "retur" | "cancel" | "stock" | "team" | "reset" | "allNota") {
  const role = session?.role ?? "admin";
  if (action === "nota") return role === "admin" || role === "sales";
  if (action === "pay") return role !== "gudang";
  if (action === "retur" || action === "cancel" || action === "team" || action === "reset") return role === "admin";
  if (action === "stock") return role === "admin" || role === "gudang";
  if (action === "allNota") return role === "admin";
  return false;
}

export function scopeInvoices(invoices: Invoice[], session: Session | null, sales: SalesPerson[]): Invoice[] {
  if (!session || session.role === "admin" || session.role === "gudang") return invoices;
  if (session.role === "sales") return invoices.filter((inv) => inv.salesId === session.salesId);
  if (session.role === "leader") {
    const ids = new Set(sales.filter((s) => s.leaderId === session.leaderId).map((s) => s.id));
    return invoices.filter((inv) => ids.has(inv.salesId));
  }
  return invoices;
}

export function isAllowedPath(pathname: string, role: Role): boolean {
  const allowed = navFor(role).some((item) => {
    if (item.href === "/") return pathname === "/";
    if (item.href === "/nota") return pathname === "/nota" || /^\/nota\/(?!baru)/.test(pathname);
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  });
  if (allowed) return true;
  if (pathname.startsWith("/nota/") && (role === "admin" || role === "sales" || role === "leader")) return true;
  return false;
}
