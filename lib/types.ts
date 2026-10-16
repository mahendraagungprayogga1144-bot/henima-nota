export type Role = "admin" | "gudang" | "sales" | "leader";

export type Session = {
  role: Role;
  actorName: string;
  salesId: string | null;
  leaderId: string | null;
};

export type Activity = {
  id: string;
  at: string;
  actor: string;
  role: Role;
  action: string;
  detail: string;
};

export type PaymentStatus = "lunas" | "dp" | "piutang";

export type MovementType = "masuk" | "keluar" | "nota" | "batal" | "retur";

export type Leader = {
  id: string;
  name: string;
};

export type SalesPerson = {
  id: string;
  name: string;
  leaderId: string | null;
};

export type Product = {
  id: string;
  sku: string;
  name: string;
  size: string;
  unit: string;
  stock: number;
  minStock: number;
  price: number;
};

export type StockMovement = {
  id: string;
  at: string;
  type: MovementType;
  productId: string;
  qty: number;
  note: string;
  invoiceId?: string;
};

export type InvoiceItem = {
  productId: string;
  name: string;
  sku: string;
  qty: number;
  price: number;
};

export type PaymentRecord = {
  id: string;
  at: string;
  amount: number;
  note: string;
};

export type Invoice = {
  id: string;
  number: string;
  at: string;
  customerName: string;
  customerPhone: string;
  salesId: string;
  items: InvoiceItem[];
  discount: number;
  paidAmount: number;
  payments: PaymentRecord[];
  status: PaymentStatus;
  note: string;
  cancelled: boolean;
  returned: boolean;
};

export type AppState = {
  leaders: Leader[];
  sales: SalesPerson[];
  products: Product[];
  invoices: Invoice[];
  movements: StockMovement[];
  activities: Activity[];
};

export type NewInvoiceInput = {
  customerName: string;
  customerPhone: string;
  salesId: string;
  items: InvoiceItem[];
  discount: number;
  status: PaymentStatus;
  paidAmount: number;
  note: string;
};

export type NewProductInput = {
  sku: string;
  name: string;
  size: string;
  unit: string;
  stock: number;
  minStock: number;
  price: number;
};
