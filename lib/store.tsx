"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { invoiceTotal, nextInvoiceNumber } from "./format";
import { STORAGE_KEY, createSeed } from "./seed";
import { cloudConfigured } from "./supabase/config";
import { getSupabase } from "./supabase/client";
import { fetchProfile, pullCloudState, pushCloudState } from "./supabase/sync";
import type {
  Activity,
  AppState,
  Invoice,
  NewInvoiceInput,
  NewProductInput,
  Product,
  Session,
} from "./types";

type StoreContextValue = {
  ready: boolean;
  state: AppState;
  session: Session | null;
  cloudEnabled: boolean;
  signIn: (session: Session) => void;
  signInEmail: (email: string, password: string) => Promise<void>;
  signUpEmail: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => void;
  createInvoice: (input: NewInvoiceInput) => Invoice;
  cancelInvoice: (id: string) => void;
  returnInvoice: (id: string) => void;
  recordPayment: (id: string, amount: number, note?: string) => void;
  addStock: (productId: string, qty: number, note: string) => void;
  removeStock: (productId: string, qty: number, note: string) => void;
  addProduct: (input: NewProductInput) => void;
  updateProduct: (id: string, input: NewProductInput) => void;
  removeProduct: (id: string) => void;
  addLeader: (name: string) => void;
  updateLeader: (id: string, name: string) => void;
  removeLeader: (id: string) => void;
  addSales: (name: string, leaderId: string | null) => void;
  updateSales: (id: string, name: string, leaderId: string | null) => void;
  removeSales: (id: string) => void;
  resetData: () => void;
};

const SESSION_KEY = "henima-session-v2";
const sessionListeners = new Set<() => void>();
let sessionSnap: Session | null = null;
let sessionLoaded = false;

function loadSession(): Session | null {
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

function getSessionSnapshot(): Session | null {
  if (!sessionLoaded) {
    sessionLoaded = true;
    if (cloudConfigured()) {
      sessionSnap = null;
    } else {
      sessionSnap = typeof window === "undefined" ? null : loadSession();
    }
  }
  return sessionSnap;
}

function emitSession() {
  sessionListeners.forEach((listener) => listener());
}

function persistSession(next: Session | null) {
  sessionSnap = next;
  if (next) window.localStorage.setItem(SESSION_KEY, JSON.stringify(next));
  else window.localStorage.removeItem(SESSION_KEY);
  emitSession();
}

function withLog(prev: AppState, action: string, detail: string): AppState {
  const session = getSessionSnapshot();
  const entry: Activity = {
    id: uid("act"),
    at: new Date().toISOString(),
    actor: session?.actorName ?? "Sistem",
    role: session?.role ?? "admin",
    action,
    detail,
  };
  return {
    ...prev,
    activities: [entry, ...(prev.activities ?? [])].slice(0, 200),
  };
}

const StoreContext = createContext<StoreContextValue | null>(null);
const SERVER_SEED = createSeed();
const listeners = new Set<() => void>();
let snapshot: AppState = SERVER_SEED;
let didLoad = false;

function uid(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function loadState(): AppState | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AppState;
    if (!parsed?.products || !parsed?.invoices) return null;
    return {
      ...parsed,
      invoices: parsed.invoices.map((inv) => ({
        ...inv,
        returned: inv.returned ?? false,
        payments: inv.payments ?? [],
      })),
      activities: parsed.activities ?? [],
    };
  } catch {
    return null;
  }
}

function emit() {
  listeners.forEach((listener) => listener());
}

let cloudHydrated = false;
let pushTimer: number | null = null;

function schedulePush(state: AppState) {
  if (!cloudHydrated || !getSupabase()) return;
  if (pushTimer) window.clearTimeout(pushTimer);
  pushTimer = window.setTimeout(() => {
    void pushCloudState(state).catch((err) => {
      console.error("Gagal sinkron ke server", err);
    });
  }, 400);
}

function applyState(next: AppState) {
  snapshot = next;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  emit();
}

function commit(next: AppState) {
  applyState(next);
  schedulePush(next);
}

function getClientSnapshot(): AppState {
  if (!didLoad) {
    didLoad = true;
    snapshot = loadState() ?? SERVER_SEED;
  }
  return snapshot;
}

function getServerSnapshot(): AppState {
  return SERVER_SEED;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const state = useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
  const ready = useSyncExternalStore(subscribe, () => true, () => false);
  const session = useSyncExternalStore(
    (listener) => {
      sessionListeners.add(listener);
      return () => sessionListeners.delete(listener);
    },
    getSessionSnapshot,
    () => null,
  );

  const signIn = useCallback((next: Session) => {
    persistSession(next);
  }, []);

  const signInEmail = useCallback(async (email: string, password: string) => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Server belum dihubungkan. Buka /setup dulu.");
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (!data.user) throw new Error("Gagal masuk.");
    const profile = await fetchProfile(data.user.id);
    if (profile) persistSession(profile);
  }, []);

  const signUpEmail = useCallback(async (name: string, email: string, password: string) => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Server belum dihubungkan. Buka /setup dulu.");
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    if (error) throw error;
    if (!data.session || !data.user) {
      throw new Error("Cek email konfirmasi, atau matikan Confirm email di Supabase Authentication.");
    }
    const profile = await fetchProfile(data.user.id);
    if (profile) persistSession(profile);
  }, []);

  const signOut = useCallback(() => {
    persistSession(null);
    const supabase = getSupabase();
    if (supabase) void supabase.auth.signOut();
  }, []);

  useEffect(() => {
    const client = getSupabase();
    if (!client) return;

    async function afterAuth(userId: string | undefined) {
      if (!userId) {
        cloudHydrated = false;
        persistSession(null);
        return;
      }
      const profile = await fetchProfile(userId);
      if (profile) persistSession(profile);
      const remote = await pullCloudState();
      const local = getClientSnapshot();
      if (remote && remote.products.length > 0) {
        if (remote.invoices.length === 0 && local.invoices.length > 0) {
          const merged = {
            ...remote,
            invoices: local.invoices,
            movements: local.movements,
            activities: local.activities,
          };
          applyState(merged);
          cloudHydrated = true;
          schedulePush(merged);
          return;
        }
        applyState(remote);
        cloudHydrated = true;
        return;
      }
      cloudHydrated = true;
      schedulePush(local);
    }

    const { data } = client.auth.onAuthStateChange((event, authSession) => {
      if (event === "TOKEN_REFRESHED") return;
      void afterAuth(authSession?.user?.id);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const createInvoice = useCallback((input: NewInvoiceInput) => {
    const current = getSessionSnapshot();
    const payload =
      current?.role === "sales" && current.salesId
        ? { ...input, salesId: current.salesId }
        : input;
    const built = buildInvoice(getClientSnapshot(), payload);
    commit(withLog(built.state, "Buat nota", `${built.invoice.number} · ${built.invoice.customerName}`));
    return built.invoice;
  }, []);

  const cancelInvoice = useCallback((id: string) => {
    const prev = getClientSnapshot();
    const invoice = prev.invoices.find((row) => row.id === id);
    if (!invoice || invoice.cancelled || invoice.returned) return;

    const products = prev.products.map((p) => ({ ...p }));
    for (const item of invoice.items) {
      const product = products.find((p) => p.id === item.productId);
      if (product) product.stock += item.qty;
    }

    const at = new Date().toISOString();
    commit(
      withLog(
        {
          ...prev,
          products,
          invoices: prev.invoices.map((row) => (row.id === id ? { ...row, cancelled: true } : row)),
          movements: [
            ...invoice.items.map((item) => ({
              id: uid("mov"),
              at,
              type: "batal" as const,
              productId: item.productId,
              qty: item.qty,
              note: `Batal ${invoice.number}`,
              invoiceId: invoice.id,
            })),
            ...prev.movements,
          ],
        },
        "Batal nota",
        invoice.number,
      ),
    );
  }, []);

  const returnInvoice = useCallback((id: string) => {
    const prev = getClientSnapshot();
    const invoice = prev.invoices.find((row) => row.id === id);
    if (!invoice || invoice.cancelled || invoice.returned) {
      throw new Error("Nota ini tidak bisa diretur.");
    }

    const products = prev.products.map((p) => ({ ...p }));
    for (const item of invoice.items) {
      const product = products.find((p) => p.id === item.productId);
      if (product) product.stock += item.qty;
    }

    const at = new Date().toISOString();
    commit(
      withLog(
        {
          ...prev,
          products,
          invoices: prev.invoices.map((row) => (row.id === id ? { ...row, returned: true } : row)),
          movements: [
            ...invoice.items.map((item) => ({
              id: uid("mov"),
              at,
              type: "retur" as const,
              productId: item.productId,
              qty: item.qty,
              note: `Retur ${invoice.number}`,
              invoiceId: invoice.id,
            })),
            ...prev.movements,
          ],
        },
        "Retur",
        invoice.number,
      ),
    );
  }, []);

  const recordPayment = useCallback((id: string, amount: number, note = "Pelunasan") => {
    if (amount <= 0) throw new Error("Jumlah bayar harus lebih dari 0.");
    const prev = getClientSnapshot();
    const invoice = prev.invoices.find((row) => row.id === id);
    if (!invoice || invoice.cancelled || invoice.returned) {
      throw new Error("Nota ini tidak bisa menerima pembayaran.");
    }
    const total = invoiceTotal(invoice.items, invoice.discount);
    const remaining = Math.max(0, total - invoice.paidAmount);
    if (remaining <= 0) throw new Error("Nota sudah lunas.");
    const paid = Math.min(amount, remaining);
    const paidAmount = invoice.paidAmount + paid;
    const status = paidAmount >= total ? "lunas" : paidAmount > 0 ? "dp" : "piutang";
    const at = new Date().toISOString();
    commit(
      withLog(
        {
          ...prev,
          invoices: prev.invoices.map((row) =>
            row.id === id
              ? {
                  ...row,
                  paidAmount,
                  status,
                  payments: [
                    ...(row.payments ?? []),
                    { id: uid("pay"), at, amount: paid, note },
                  ],
                }
              : row,
          ),
        },
        "Pelunasan",
        `${invoice.number} · ${paid}`,
      ),
    );
  }, []);

  const addLeader = useCallback((name: string) => {
    const trimmed = name.trim();
    if (!trimmed) throw new Error("Nama leader wajib diisi.");
    const prev = getClientSnapshot();
    commit(withLog({ ...prev, leaders: [...prev.leaders, { id: uid("led"), name: trimmed }] }, "Tambah leader", trimmed));
  }, []);

  const updateLeader = useCallback((id: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) throw new Error("Nama leader wajib diisi.");
    const prev = getClientSnapshot();
    if (!prev.leaders.some((row) => row.id === id)) throw new Error("Leader tidak ditemukan.");
    commit(
      withLog(
        { ...prev, leaders: prev.leaders.map((row) => (row.id === id ? { ...row, name: trimmed } : row)) },
        "Ubah leader",
        trimmed,
      ),
    );
  }, []);

  const removeLeader = useCallback((id: string) => {
    const prev = getClientSnapshot();
    const leader = prev.leaders.find((row) => row.id === id);
    if (!leader) throw new Error("Leader tidak ditemukan.");
    if (prev.sales.some((row) => row.leaderId === id)) {
      throw new Error("Masih ada sales di bawah leader ini. Pindahkan dulu.");
    }
    commit(
      withLog({ ...prev, leaders: prev.leaders.filter((row) => row.id !== id) }, "Hapus leader", leader.name),
    );
  }, []);

  const addSales = useCallback((name: string, leaderId: string | null) => {
    const trimmed = name.trim();
    if (!trimmed) throw new Error("Nama sales wajib diisi.");
    const prev = getClientSnapshot();
    commit(
      withLog(
        { ...prev, sales: [...prev.sales, { id: uid("sls"), name: trimmed, leaderId }] },
        "Tambah sales",
        trimmed,
      ),
    );
  }, []);

  const updateSales = useCallback((id: string, name: string, leaderId: string | null) => {
    const trimmed = name.trim();
    if (!trimmed) throw new Error("Nama sales wajib diisi.");
    const prev = getClientSnapshot();
    if (!prev.sales.some((row) => row.id === id)) throw new Error("Sales tidak ditemukan.");
    commit(
      withLog(
        {
          ...prev,
          sales: prev.sales.map((row) => (row.id === id ? { ...row, name: trimmed, leaderId } : row)),
        },
        "Ubah sales",
        trimmed,
      ),
    );
  }, []);

  const removeSales = useCallback((id: string) => {
    const prev = getClientSnapshot();
    const person = prev.sales.find((row) => row.id === id);
    if (!person) throw new Error("Sales tidak ditemukan.");
    if (prev.invoices.some((row) => row.salesId === id)) {
      throw new Error("Sales ini sudah punya nota. Ubah namanya saja, jangan dihapus.");
    }
    commit(withLog({ ...prev, sales: prev.sales.filter((row) => row.id !== id) }, "Hapus sales", person.name));
  }, []);

  const addStock = useCallback((productId: string, qty: number, note: string) => {
    if (qty <= 0) throw new Error("Jumlah harus lebih dari 0.");
    commit(withLog(mutateStock(getClientSnapshot(), productId, qty, "masuk", note || "Barang masuk"), "Stok masuk", note || `${qty}`));
  }, []);

  const removeStock = useCallback((productId: string, qty: number, note: string) => {
    if (qty <= 0) throw new Error("Jumlah harus lebih dari 0.");
    const prev = getClientSnapshot();
    const product = prev.products.find((p) => p.id === productId);
    if (!product) throw new Error("Produk tidak ditemukan.");
    if (product.stock < qty) throw new Error(`Stok ${product.name} tidak cukup.`);
    commit(withLog(mutateStock(prev, productId, qty, "keluar", note || "Barang keluar"), "Stok keluar", `${product.name} · ${qty}`));
  }, []);

  const addProduct = useCallback((input: NewProductInput) => {
    const prev = getClientSnapshot();
    const sku = input.sku.trim().toUpperCase();
    if (!sku || !input.name.trim()) throw new Error("SKU dan nama wajib diisi.");
    if (prev.products.some((p) => p.sku === sku)) throw new Error("SKU sudah dipakai.");
    const product: Product = {
      id: uid("prd"),
      sku,
      name: input.name.trim(),
      size: input.size.trim() || "—",
      unit: input.unit.trim() || "pcs",
      stock: Math.max(0, input.stock),
      minStock: Math.max(0, input.minStock),
      price: Math.max(0, input.price),
    };
    commit(
      withLog(
        {
          ...prev,
          products: [...prev.products, product],
          movements:
            product.stock > 0
              ? [
                  {
                    id: uid("mov"),
                    at: new Date().toISOString(),
                    type: "masuk" as const,
                    productId: product.id,
                    qty: product.stock,
                    note: "Stok awal produk baru",
                  },
                  ...prev.movements,
                ]
              : prev.movements,
        },
        "Produk baru",
        product.name,
      ),
    );
  }, []);

  const updateProduct = useCallback((id: string, input: NewProductInput) => {
    const prev = getClientSnapshot();
    const current = prev.products.find((row) => row.id === id);
    if (!current) throw new Error("Produk tidak ditemukan.");
    const sku = input.sku.trim().toUpperCase();
    if (!sku || !input.name.trim()) throw new Error("SKU dan nama wajib diisi.");
    if (prev.products.some((row) => row.sku === sku && row.id !== id)) throw new Error("SKU sudah dipakai.");
    commit(
      withLog(
        {
          ...prev,
          products: prev.products.map((row) =>
            row.id === id
              ? {
                  ...row,
                  sku,
                  name: input.name.trim(),
                  size: input.size.trim() || "—",
                  unit: input.unit.trim() || "pcs",
                  minStock: Math.max(0, input.minStock),
                  price: Math.max(0, input.price),
                }
              : row,
          ),
        },
        "Ubah produk",
        input.name.trim(),
      ),
    );
  }, []);

  const removeProduct = useCallback((id: string) => {
    const prev = getClientSnapshot();
    const product = prev.products.find((row) => row.id === id);
    if (!product) throw new Error("Produk tidak ditemukan.");
    if (prev.invoices.some((inv) => inv.items.some((item) => item.productId === id))) {
      throw new Error("Produk sudah ada di nota. Ubah saja datanya, jangan dihapus.");
    }
    commit(
      withLog(
        {
          ...prev,
          products: prev.products.filter((row) => row.id !== id),
          movements: prev.movements.filter((row) => row.productId !== id),
        },
        "Hapus produk",
        product.name,
      ),
    );
  }, []);

  const resetData = useCallback(() => {
    commit(createSeed());
  }, []);

  const value = useMemo(
    () => ({
      ready,
      state,
      session,
      cloudEnabled: cloudConfigured(),
      signIn,
      signInEmail,
      signUpEmail,
      signOut,
      createInvoice,
      cancelInvoice,
      returnInvoice,
      recordPayment,
      addStock,
      removeStock,
      addProduct,
      updateProduct,
      removeProduct,
      addLeader,
      updateLeader,
      removeLeader,
      addSales,
      updateSales,
      removeSales,
      resetData,
    }),
    [ready, state, session, signIn, signInEmail, signUpEmail, signOut, createInvoice, cancelInvoice, returnInvoice, recordPayment, addStock, removeStock, addProduct, updateProduct, removeProduct, addLeader, updateLeader, removeLeader, addSales, updateSales, removeSales, resetData],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

function buildInvoice(prev: AppState, input: NewInvoiceInput): { state: AppState; invoice: Invoice } {
  if (!input.customerName.trim()) {
    throw new Error("Nama customer wajib diisi.");
  }
  if (!input.salesId) {
    throw new Error("Pilih sales yang closing.");
  }
  if (input.items.length === 0) {
    throw new Error("Tambah minimal satu produk.");
  }

  const products = prev.products.map((p) => ({ ...p }));
  for (const item of input.items) {
    const product = products.find((p) => p.id === item.productId);
    if (!product) throw new Error(`Produk tidak ditemukan: ${item.name}`);
    if (item.qty <= 0) throw new Error(`Qty ${item.name} tidak valid.`);
    if (product.stock < item.qty) {
      throw new Error(`Stok ${product.name} kurang. Sisa ${product.stock} ${product.unit}.`);
    }
    product.stock -= item.qty;
  }

  const total = invoiceTotal(input.items, input.discount);
  const paid =
    input.status === "lunas"
      ? total
      : input.status === "piutang"
        ? 0
        : Math.min(input.paidAmount, total);

  const invoice: Invoice = {
    id: uid("inv"),
    number: nextInvoiceNumber(prev.invoices),
    at: new Date().toISOString(),
    customerName: input.customerName.trim(),
    customerPhone: input.customerPhone.trim(),
    salesId: input.salesId,
    items: input.items,
    discount: Math.max(0, input.discount),
    paidAmount: Math.max(0, paid),
    payments:
      paid > 0
        ? [
            {
              id: uid("pay"),
              at: new Date().toISOString(),
              amount: paid,
              note: input.status === "lunas" ? "Lunas saat nota" : "DP",
            },
          ]
        : [],
    status: input.status,
    note: input.note.trim(),
    cancelled: false,
    returned: false,
  };

  return {
    invoice,
    state: {
      ...prev,
      products,
      invoices: [invoice, ...prev.invoices],
      movements: [
        ...input.items.map((item) => ({
          id: uid("mov"),
          at: invoice.at,
          type: "nota" as const,
          productId: item.productId,
          qty: item.qty,
          note: invoice.number,
          invoiceId: invoice.id,
        })),
        ...prev.movements,
      ],
    },
  };
}

function mutateStock(
  prev: AppState,
  productId: string,
  qty: number,
  type: "masuk" | "keluar",
  note: string,
): AppState {
  const delta = type === "masuk" ? qty : -qty;
  return {
    ...prev,
    products: prev.products.map((p) =>
      p.id === productId ? { ...p, stock: p.stock + delta } : p,
    ),
    movements: [
      {
        id: uid("mov"),
        at: new Date().toISOString(),
        type,
        productId,
        qty,
        note,
      },
      ...prev.movements,
    ],
  };
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore harus di dalam StoreProvider");
  return ctx;
}
