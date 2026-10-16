import type { AppState } from "./types";

export const STORAGE_KEY = "henima-internal-v2";

export function createSeed(): AppState {
  return {
    leaders: [],
    sales: [],
    products: [],
    invoices: [],
    movements: [],
    activities: [],
  };
}
