import { pgTable, text, serial, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const staffUsersTable = pgTable("staff_users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull().default(""),
  plainPassword: text("plain_password").notNull().default(""),
  name: text("name").notNull(),
  status: text("status").notNull().default("active"), // active | suspended | disabled
  maxBeneficiariesQuota: integer("max_beneficiaries_quota").notNull().default(5),
  canEditBeneficiaries: boolean("can_edit_beneficiaries").notNull().default(true),
  canManagePhases: boolean("can_manage_phases").notNull().default(false),
  canAddBeneficiaries: boolean("can_add_beneficiaries").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertStaffUserSchema = createInsertSchema(staffUsersTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  passwordHash: true,
});

export const updateStaffUserSchema = insertStaffUserSchema.partial();

export type InsertStaffUser = z.infer<typeof insertStaffUserSchema>;
export type StaffUser = typeof staffUsersTable.$inferSelect;
