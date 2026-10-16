import type { AppState, Invoice, Session } from "@/lib/types";
import { getSupabase } from "./client";

type ProfileRow = {
  name: string;
  role: Session["role"];
  sales_id: string | null;
  leader_id: string | null;
};

export async function fetchProfile(userId: string): Promise<Session | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase.from("profiles").select("name, role, sales_id, leader_id").eq("id", userId).maybeSingle();
  if (error || !data) return null;
  const row = data as ProfileRow;
  return {
    actorName: row.name,
    role: row.role,
    salesId: row.sales_id,
    leaderId: row.leader_id,
  };
}

export async function pullCloudState(): Promise<AppState | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const [leaders, sales, products, invoices, items, payments, movements, activities] = await Promise.all([
    supabase.from("leaders").select("*"),
    supabase.from("sales_people").select("*"),
    supabase.from("products").select("*"),
    supabase.from("invoices").select("*").order("at", { ascending: false }),
    supabase.from("invoice_items").select("*"),
    supabase.from("payments").select("*"),
    supabase.from("stock_movements").select("*").order("at", { ascending: false }),
    supabase.from("activities").select("*").order("at", { ascending: false }).limit(200),
  ]);

  if (leaders.error || sales.error || products.error || invoices.error) {
    console.error(leaders.error || sales.error || products.error || invoices.error);
    return null;
  }

  const itemsByInvoice = new Map<string, Invoice["items"]>();
  for (const row of items.data ?? []) {
    const list = itemsByInvoice.get(row.invoice_id) ?? [];
    list.push({
      productId: row.product_id,
      name: row.name,
      sku: row.sku,
      qty: row.qty,
      price: row.price,
    });
    itemsByInvoice.set(row.invoice_id, list);
  }

  const paymentsByInvoice = new Map<string, Invoice["payments"]>();
  for (const row of payments.data ?? []) {
    const list = paymentsByInvoice.get(row.invoice_id) ?? [];
    list.push({ id: row.id, at: row.at, amount: row.amount, note: row.note });
    paymentsByInvoice.set(row.invoice_id, list);
  }

  return {
    leaders: (leaders.data ?? []).map((row) => ({ id: row.id, name: row.name })),
    sales: (sales.data ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      leaderId: row.leader_id,
    })),
    products: (products.data ?? []).map((row) => ({
      id: row.id,
      sku: row.sku,
      name: row.name,
      size: row.size,
      unit: row.unit,
      stock: row.stock,
      minStock: row.min_stock,
      price: row.price,
    })),
    invoices: (invoices.data ?? []).map((row) => ({
      id: row.id,
      number: row.number,
      at: row.at,
      customerName: row.customer_name,
      customerPhone: row.customer_phone,
      salesId: row.sales_id,
      items: itemsByInvoice.get(row.id) ?? [],
      discount: row.discount,
      paidAmount: row.paid_amount,
      payments: paymentsByInvoice.get(row.id) ?? [],
      status: row.status,
      note: row.note,
      cancelled: row.cancelled,
      returned: row.returned,
    })),
    movements: (movements.data ?? []).map((row) => ({
      id: row.id,
      at: row.at,
      type: row.type,
      productId: row.product_id,
      qty: row.qty,
      note: row.note,
      invoiceId: row.invoice_id ?? undefined,
    })),
    activities: (activities.data ?? []).map((row) => ({
      id: row.id,
      at: row.at,
      actor: row.actor,
      role: row.role,
      action: row.action,
      detail: row.detail,
    })),
  };
}

export async function pushCloudState(state: AppState): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  const { error: e1 } = await supabase.from("leaders").upsert(state.leaders.map((row) => ({ id: row.id, name: row.name })));
  if (e1) throw e1;

  const { error: e2 } = await supabase.from("sales_people").upsert(
    state.sales.map((row) => ({ id: row.id, name: row.name, leader_id: row.leaderId })),
  );
  if (e2) throw e2;

  const { error: e3 } = await supabase.from("products").upsert(
    state.products.map((row) => ({
      id: row.id,
      sku: row.sku,
      name: row.name,
      size: row.size,
      unit: row.unit,
      stock: row.stock,
      min_stock: row.minStock,
      price: row.price,
    })),
  );
  if (e3) throw e3;

  const { error: e4 } = await supabase.from("invoices").upsert(
    state.invoices.map((row) => ({
      id: row.id,
      number: row.number,
      at: row.at,
      customer_name: row.customerName,
      customer_phone: row.customerPhone,
      sales_id: row.salesId,
      discount: row.discount,
      paid_amount: row.paidAmount,
      status: row.status,
      note: row.note,
      cancelled: row.cancelled,
      returned: row.returned,
    })),
  );
  if (e4) throw e4;

  const invoiceIds = state.invoices.map((inv) => inv.id);
  if (invoiceIds.length) {
    const { error: delItems } = await supabase.from("invoice_items").delete().in("invoice_id", invoiceIds);
    if (delItems) throw delItems;
    const { error: delPays } = await supabase.from("payments").delete().in("invoice_id", invoiceIds);
    if (delPays) throw delPays;
  }

  const itemRows = state.invoices.flatMap((inv) =>
    inv.items.map((item) => ({
      invoice_id: inv.id,
      product_id: item.productId,
      name: item.name,
      sku: item.sku,
      qty: item.qty,
      price: item.price,
    })),
  );
  if (itemRows.length) {
    const { error } = await supabase.from("invoice_items").insert(itemRows);
    if (error) throw error;
  }

  const paymentRows = state.invoices.flatMap((inv) =>
    (inv.payments ?? []).map((pay) => ({
      id: pay.id,
      invoice_id: inv.id,
      at: pay.at,
      amount: pay.amount,
      note: pay.note,
    })),
  );
  if (paymentRows.length) {
    const { error } = await supabase.from("payments").insert(paymentRows);
    if (error) throw error;
  }

  if (state.movements.length) {
    const { error } = await supabase.from("stock_movements").upsert(
      state.movements.map((row) => ({
        id: row.id,
        at: row.at,
        type: row.type,
        product_id: row.productId,
        qty: row.qty,
        note: row.note,
        invoice_id: row.invoiceId ?? null,
      })),
    );
    if (error) throw error;
  }

  if (state.activities.length) {
    const { error } = await supabase.from("activities").upsert(
      state.activities.map((row) => ({
        id: row.id,
        at: row.at,
        actor: row.actor,
        role: row.role,
        action: row.action,
        detail: row.detail,
      })),
    );
    if (error) throw error;
  }
}
