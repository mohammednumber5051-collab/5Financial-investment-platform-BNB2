import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

export const financialTransactionsTable = pgTable("financial_transactions", {
  id: serial("id").primaryKey(),
  beneficiaryId: integer("beneficiary_id").notNull(),
  type: text("type").notNull(),
  amount: text("amount").notNull().default("0"),
  description: text("description").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type FinancialTransaction = typeof financialTransactionsTable.$inferSelect;
