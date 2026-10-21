import { describe, expect, it } from "vitest";
import { byCategory, byCrop, byMonth, expenseSchema, incomeSchema, inRange, saleTotal, summarize } from "@/lib/finance";

describe("farm finance", () => {
  it("sale total is quantity x price, rounded to paise", () => {
    expect(saleTotal(12.5, 2400)).toBe(30000);
    expect(saleTotal(0.1, 0.2)).toBe(0.02);
  });
  it("net profit = income - expenses", () => {
    expect(summarize([{ amount: 1500 }, { amount: 2500.5 }], [{ total_amount: 3000 }])).toEqual({
      totalExpenses: 4000.5, totalIncome: 3000, net: -1000.5,
    });
  });
  it("groups profit per crop case-insensitively", () => {
    const r = byCrop([{ crop_name: "Onion", amount: 1000 }], [{ crop_name: "onion ", total_amount: 5000 }]);
    expect(r).toEqual([{ crop: "Onion", expenses: 1000, income: 5000, profit: 4000 }]);
  });
  it("groups by month and category", () => {
    expect(byMonth([{ expense_date: "2026-03-02", amount: 10 }], [{ sale_date: "2026-03-30", total_amount: 50 }]))
      .toEqual([{ month: "2026-03", expenses: 10, income: 50 }]);
    expect(byCategory([{ category: "seeds", amount: 5 }, { category: "seeds", amount: 7 }])).toEqual([{ category: "seeds", value: 12 }]);
  });
  it("date range filter is inclusive", () => {
    expect(inRange("2026-01-01", "2026-01-01", "2026-01-31")).toBe(true);
    expect(inRange("2026-02-01", "2026-01-01", "2026-01-31")).toBe(false);
  });
  it("rejects invalid inputs", () => {
    expect(expenseSchema.safeParse({ crop_name: "Wheat", category: "seeds", amount: -5, expense_date: "2026-01-01" }).success).toBe(false);
    expect(expenseSchema.safeParse({ crop_name: "", category: "seeds", amount: 5, expense_date: "2026-01-01" }).success).toBe(false);
    expect(incomeSchema.safeParse({ crop_name: "Wheat", quantity: 0, unit: "kg", price_per_unit: 20, sale_date: "2026-01-01" }).success).toBe(false);
    expect(incomeSchema.safeParse({ crop_name: "Wheat", quantity: 2, unit: "quintal", price_per_unit: 2000, sale_date: "2026-01-01" }).success).toBe(true);
  });
});
