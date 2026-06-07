import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const beneficiariesTable = pgTable("beneficiaries", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  profits: text("profits").notNull().default("0"),
  subscription: text("subscription").notNull().default("0"),
  fees: text("fees").notNull().default("0"),
  accountHolder: text("account_holder").notNull().default(""),
  iban: text("iban").notNull().default(""),
  phone: text("phone").notNull().default(""),
  status: text("status").notNull().default("active"),
  loginTitle: text("login_title").notNull().default(""),
  loginSlug: text("login_slug").notNull().default(""),
  telegramLink: text("telegram_link").notNull().default(""),
  withdrawalFeeStatus: text("withdrawal_fee_status").notNull().default("unpaid"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertBeneficiarySchema = createInsertSchema(beneficiariesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateBeneficiarySchema = insertBeneficiarySchema.partial();

export type InsertBeneficiary = z.infer<typeof insertBeneficiarySchema>;
export type Beneficiary = typeof beneficiariesTable.$inferSelect;
