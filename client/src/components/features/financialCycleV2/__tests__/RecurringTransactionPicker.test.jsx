import { describe, expect, it } from "vitest";
import { filterRecurringTransactions } from "../RecurringTransactionPicker";

const rows = [
  {
    transactionId: 1,
    description: "Payment",
    source: "leumi",
    accountNumber: "1234",
    amount: -80,
  },
  {
    transactionId: 2,
    description: "Rent",
    source: "yahav",
    accountNumber: "5678",
    amount: 2500,
  },
  {
    transactionId: 3,
    description: "Purchase",
    source: "visa_cal",
    accountNumber: "9090",
    amount: -20,
  },
];

describe("recurring transaction search", () => {
  it.each([
    ["לאומי", 1],
    ["Bank Leumi", 1],
    ["leumi", 1],
    ["יהב", 2],
    ["כאל", 3],
    ["Visa Cal", 3],
    ["9090", 3],
  ])("finds the source by %s", (query, id) => {
    expect(
      filterRecurringTransactions(rows, query).map((row) => row.transactionId),
    ).toEqual([id]);
  });

  it("keeps the direction restriction when matching localized source names", () => {
    expect(filterRecurringTransactions(rows, "יהב", "expense")).toEqual([]);
    expect(filterRecurringTransactions(rows, "יהב", "income")).toEqual([
      rows[1],
    ]);
  });
});
