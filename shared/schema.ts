import { pgTable, text, serial, integer, numeric, date, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Transaction categories
export const categories = [
  "Housing",
  "Transportation",
  "Food",
  "Utilities",
  "Healthcare",
  "Entertainment",
  "Education",
  "Shopping",
  "Income",
  "Other",
];

// Transaction model
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  date: date("date").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  type: text("type").notNull(), // "income" or "expense"
  pdfSource: text("pdf_source"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTransactionSchema = createInsertSchema(transactions)
  .pick({
    date: true,
    description: true,
    category: true,
    amount: true,
    type: true,
    pdfSource: true,
  })
  .extend({
    date: z.coerce.date(),
    amount: z.coerce.number(),
    category: z.enum([...categories] as [string, ...string[]]),
    type: z.enum(["income", "expense"]),
  });

export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;

// Monthly summaries model
export const monthlySummaries = pgTable("monthly_summaries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  year: integer("year").notNull(),
  month: integer("month").notNull(),
  totalIncome: numeric("total_income", { precision: 10, scale: 2 }).notNull(),
  totalExpenses: numeric("total_expenses", { precision: 10, scale: 2 }).notNull(),
  netBalance: numeric("net_balance", { precision: 10, scale: 2 }).notNull(),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

export const insertMonthlySummarySchema = createInsertSchema(monthlySummaries)
  .pick({
    year: true,
    month: true,
    totalIncome: true,
    totalExpenses: true,
    netBalance: true,
  })
  .extend({
    year: z.coerce.number(),
    month: z.coerce.number(),
    totalIncome: z.coerce.number(),
    totalExpenses: z.coerce.number(),
    netBalance: z.coerce.number(),
  });

export type InsertMonthlySummary = z.infer<typeof insertMonthlySummarySchema>;
export type MonthlySummary = typeof monthlySummaries.$inferSelect;

// Category breakdowns model
export const categoryBreakdowns = pgTable("category_breakdowns", {
  id: serial("id").primaryKey(),
  summaryId: integer("summary_id").notNull(),
  category: text("category").notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  percentage: numeric("percentage", { precision: 5, scale: 2 }).notNull(),
});

export const insertCategoryBreakdownSchema = createInsertSchema(categoryBreakdowns)
  .pick({
    category: true,
    amount: true,
    percentage: true,
  })
  .extend({
    category: z.enum([...categories] as [string, ...string[]]),
    amount: z.coerce.number(),
    percentage: z.coerce.number(),
  });

export type InsertCategoryBreakdown = z.infer<typeof insertCategoryBreakdownSchema>;
export type CategoryBreakdown = typeof categoryBreakdowns.$inferSelect;
