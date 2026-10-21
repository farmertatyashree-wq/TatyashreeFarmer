import { z } from "zod";

export const EXPENSE_CATEGORIES = [
  "seeds", "fertilizers", "pesticides", "labor", "irrigation", "machinery", "transportation", "other",
] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export interface Expense {
  id: string; crop_name: string; farm_name: string | null; category: ExpenseCategory;
  amount: number; expense_date: string; quantity: string | null; notes: string | null;
}
export interface Income {
  id: string; crop_name: string; quantity: number; unit: "kg" | "quintal"; price_per_unit: number;
  total_amount: number; sale_date: string; market_name: string | null; notes: string | null;
}

const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date");
export const expenseSchema = z.object({
  crop_name: z.string().trim().min(1).max(100),
  farm_name: z.string().trim().max(100).optional().or(z.literal("")),
  category: z.enum(EXPENSE_CATEGORIES),
  amount: z.coerce.number().positive().max(100000000),
  expense_date: dateStr,
  quantity: z.string().trim().max(50).optional().or(z.literal("")),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});
export const incomeSchema = z.object({
  crop_name: z.string().trim().min(1).max(100),
  quantity: z.coerce.number().positive().max(10000000),
  unit: z.enum(["kg", "quintal"]),
  price_per_unit: z.coerce.number().positive().max(10000000),
  sale_date: dateStr,
  market_name: z.string().trim().max(100).optional().or(z.literal("")),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

/** Rounds to paise to avoid floating point drift. */
export const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
export const saleTotal = (quantity: number, price: number) => round2(quantity * price);

export const formatINR = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(n);

export function inRange(date: string, from?: string, to?: string) {
  return (!from || date >= from) && (!to || date <= to);
}

export function summarize(expenses: Pick<Expense, "amount">[], income: Pick<Income, "total_amount">[]) {
  const totalExpenses = round2(expenses.reduce((s, e) => s + Number(e.amount), 0));
  const totalIncome = round2(income.reduce((s, i) => s + Number(i.total_amount), 0));
  return { totalExpenses, totalIncome, net: round2(totalIncome - totalExpenses) };
}

export function byCrop(expenses: Pick<Expense, "crop_name" | "amount">[], income: Pick<Income, "crop_name" | "total_amount">[]) {
  const map = new Map<string, { crop: string; expenses: number; income: number }>();
  const get = (name: string) => {
    const key = name.trim().toLowerCase();
    if (!map.has(key)) map.set(key, { crop: name.trim(), expenses: 0, income: 0 });
    return map.get(key)!;
  };
  expenses.forEach((e) => (get(e.crop_name).expenses += Number(e.amount)));
  income.forEach((i) => (get(i.crop_name).income += Number(i.total_amount)));
  return [...map.values()]
    .map((r) => ({ ...r, expenses: round2(r.expenses), income: round2(r.income), profit: round2(r.income - r.expenses) }))
    .sort((a, b) => b.profit - a.profit);
}

export function byMonth(expenses: Pick<Expense, "expense_date" | "amount">[], income: Pick<Income, "sale_date" | "total_amount">[]) {
  const map = new Map<string, { month: string; expenses: number; income: number }>();
  const get = (d: string) => {
    const m = d.slice(0, 7);
    if (!map.has(m)) map.set(m, { month: m, expenses: 0, income: 0 });
    return map.get(m)!;
  };
  expenses.forEach((e) => (get(e.expense_date).expenses += Number(e.amount)));
  income.forEach((i) => (get(i.sale_date).income += Number(i.total_amount)));
  return [...map.values()]
    .map((r) => ({ ...r, expenses: round2(r.expenses), income: round2(r.income) }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

export function byCategory(expenses: Pick<Expense, "category" | "amount">[]) {
  const map = new Map<string, number>();
  expenses.forEach((e) => map.set(e.category, (map.get(e.category) ?? 0) + Number(e.amount)));
  return [...map.entries()].map(([category, value]) => ({ category, value: round2(value) })).sort((a, b) => b.value - a.value);
}
