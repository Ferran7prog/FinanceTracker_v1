import { and, eq, sql } from 'drizzle-orm';
import { db } from './db';
import {
  User,
  InsertUser,
  Transaction,
  InsertTransaction,
  MonthlySummary,
  InsertMonthlySummary,
  CategoryBreakdown,
  InsertCategoryBreakdown,
  users,
  transactions,
  monthlySummaries,
  categoryBreakdowns,
} from '@shared/schema';
import { IStorage } from './storage';
import { log } from './vite';

// Helper function to convert JavaScript Date to database date format
const dateToString = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export class PostgresStorage implements IStorage {
  
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    try {
      const result = await db.query.users.findFirst({
        where: eq(users.id, id),
      });
      return result;
    } catch (error) {
      log(`Error fetching user: ${error instanceof Error ? error.message : String(error)}`, 'database');
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const result = await db.query.users.findFirst({
        where: eq(users.username, username),
      });
      return result;
    } catch (error) {
      log(`Error fetching user by username: ${error instanceof Error ? error.message : String(error)}`, 'database');
      return undefined;
    }
  }

  async createUser(user: InsertUser): Promise<User> {
    try {
      const [result] = await db.insert(users).values(user).returning();
      return result;
    } catch (error) {
      log(`Error creating user: ${error instanceof Error ? error.message : String(error)}`, 'database');
      throw error;
    }
  }

  // Transaction methods
  async getTransactions(userId: number): Promise<Transaction[]> {
    try {
      const result = await db.query.transactions.findMany({
        where: eq(transactions.userId, userId),
        orderBy: (transactions, { desc }) => [desc(transactions.date)],
      });
      return result;
    } catch (error) {
      log(`Error fetching transactions: ${error instanceof Error ? error.message : String(error)}`, 'database');
      return [];
    }
  }

  async getTransactionsByMonth(userId: number, year: number, month: number): Promise<Transaction[]> {
    try {
      // Create a date range for the specified month
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0); // Last day of the month
      
      const result = await db.query.transactions.findMany({
        where: and(
          eq(transactions.userId, userId),
          // Filter by date range
          // Note: This is a simplified approach and might need refinement based on how dates are stored
          // The actual implementation might need to be adjusted based on testing
        ),
        orderBy: (transactions, { desc }) => [desc(transactions.date)],
      });
      
      // Filter in-memory by date since drizzle doesn't have great date range operators
      return result.filter(transaction => {
        const txDate = new Date(transaction.date);
        return txDate >= startDate && txDate <= endDate;
      });
    } catch (error) {
      log(`Error fetching transactions by month: ${error instanceof Error ? error.message : String(error)}`, 'database');
      return [];
    }
  }

  async getTransactionById(id: number): Promise<Transaction | undefined> {
    try {
      const result = await db.query.transactions.findFirst({
        where: eq(transactions.id, id),
      });
      return result;
    } catch (error) {
      log(`Error fetching transaction: ${error instanceof Error ? error.message : String(error)}`, 'database');
      return undefined;
    }
  }

  async createTransaction(userId: number, transaction: InsertTransaction): Promise<Transaction> {
    try {
      // Convert Date to string format and numbers to strings for database
      const { date, amount, ...rest } = transaction;
      
      const [result] = await db.insert(transactions).values({
        ...rest,
        date: dateToString(date),
        amount: String(amount),
        userId,
      }).returning();
      
      return result;
    } catch (error) {
      log(`Error creating transaction: ${error instanceof Error ? error.message : String(error)}`, 'database');
      throw error;
    }
  }

  async updateTransaction(id: number, updateData: Partial<InsertTransaction>): Promise<Transaction | undefined> {
    try {
      // Handle date and amount conversion if present
      const dbUpdateData: Record<string, any> = {};
      
      // Only copy properties we want to update
      if (updateData.date) {
        dbUpdateData.date = dateToString(updateData.date);
      }
      
      if (updateData.amount !== undefined) {
        dbUpdateData.amount = String(updateData.amount);
      }
      
      if (updateData.description !== undefined) {
        dbUpdateData.description = updateData.description;
      }
      
      if (updateData.category !== undefined) {
        dbUpdateData.category = updateData.category;
      }
      
      if (updateData.type !== undefined) {
        dbUpdateData.type = updateData.type;
      }
      
      if (updateData.pdfSource !== undefined) {
        dbUpdateData.pdfSource = updateData.pdfSource;
      }
      
      const [result] = await db.update(transactions)
        .set(dbUpdateData)
        .where(eq(transactions.id, id))
        .returning();
        
      return result;
    } catch (error) {
      log(`Error updating transaction: ${error instanceof Error ? error.message : String(error)}`, 'database');
      return undefined;
    }
  }

  async deleteTransaction(id: number): Promise<boolean> {
    try {
      const [result] = await db.delete(transactions)
        .where(eq(transactions.id, id))
        .returning();
      return !!result;
    } catch (error) {
      log(`Error deleting transaction: ${error instanceof Error ? error.message : String(error)}`, 'database');
      return false;
    }
  }

  // Monthly Summary methods
  async getMonthlySummaries(userId: number): Promise<MonthlySummary[]> {
    try {
      const result = await db.query.monthlySummaries.findMany({
        where: eq(monthlySummaries.userId, userId),
        orderBy: (monthlySummaries, { desc }) => [
          desc(monthlySummaries.year),
          desc(monthlySummaries.month)
        ],
      });
      return result;
    } catch (error) {
      log(`Error fetching monthly summaries: ${error instanceof Error ? error.message : String(error)}`, 'database');
      return [];
    }
  }

  async getMonthlySummaryByMonth(userId: number, year: number, month: number): Promise<MonthlySummary | undefined> {
    try {
      const result = await db.query.monthlySummaries.findFirst({
        where: and(
          eq(monthlySummaries.userId, userId),
          eq(monthlySummaries.year, year),
          eq(monthlySummaries.month, month),
        ),
      });
      return result;
    } catch (error) {
      log(`Error fetching monthly summary: ${error instanceof Error ? error.message : String(error)}`, 'database');
      return undefined;
    }
  }

  async createOrUpdateMonthlySummary(userId: number, summaryData: InsertMonthlySummary): Promise<MonthlySummary> {
    try {
      // Check if a summary already exists for this month
      const existingSummary = await this.getMonthlySummaryByMonth(
        userId,
        summaryData.year,
        summaryData.month,
      );

      // Convert numeric values to strings for PostgreSQL
      const dbData = {
        year: summaryData.year,
        month: summaryData.month,
        totalIncome: String(summaryData.totalIncome),
        totalExpenses: String(summaryData.totalExpenses),
        netBalance: String(summaryData.netBalance)
      };

      if (existingSummary) {
        // Update existing summary
        const [result] = await db.update(monthlySummaries)
          .set({
            ...dbData,
            lastUpdated: new Date(),
          })
          .where(eq(monthlySummaries.id, existingSummary.id))
          .returning();
        return result;
      } else {
        // Create new summary
        const [result] = await db.insert(monthlySummaries)
          .values({
            ...dbData,
            userId,
          })
          .returning();
        return result;
      }
    } catch (error) {
      log(`Error creating/updating monthly summary: ${error instanceof Error ? error.message : String(error)}`, 'database');
      throw error;
    }
  }

  // Category Breakdown methods
  async getCategoryBreakdowns(summaryId: number): Promise<CategoryBreakdown[]> {
    try {
      const result = await db.query.categoryBreakdowns.findMany({
        where: eq(categoryBreakdowns.summaryId, summaryId),
      });
      return result;
    } catch (error) {
      log(`Error fetching category breakdowns: ${error instanceof Error ? error.message : String(error)}`, 'database');
      return [];
    }
  }

  async createCategoryBreakdown(summaryId: number, breakdown: InsertCategoryBreakdown): Promise<CategoryBreakdown> {
    try {
      // Convert numeric values to strings for PostgreSQL
      const dbData = {
        category: breakdown.category,
        amount: String(breakdown.amount),
        percentage: String(breakdown.percentage),
        summaryId,
      };
      
      const [result] = await db.insert(categoryBreakdowns)
        .values(dbData)
        .returning();
        
      return result;
    } catch (error) {
      log(`Error creating category breakdown: ${error instanceof Error ? error.message : String(error)}`, 'database');
      throw error;
    }
  }

  async updateCategoryBreakdowns(summaryId: number, breakdowns: InsertCategoryBreakdown[]): Promise<CategoryBreakdown[]> {
    try {
      // Delete existing breakdowns for this summary
      await db.delete(categoryBreakdowns)
        .where(eq(categoryBreakdowns.summaryId, summaryId));
      
      // Insert new breakdowns
      if (breakdowns.length === 0) {
        return [];
      }
      
      // Convert numeric values to strings for PostgreSQL
      const dbValues = breakdowns.map(breakdown => ({
        category: breakdown.category,
        amount: String(breakdown.amount),
        percentage: String(breakdown.percentage),
        summaryId,
      }));
      
      const result = await db.insert(categoryBreakdowns)
        .values(dbValues)
        .returning();
      
      return result;
    } catch (error) {
      log(`Error updating category breakdowns: ${error instanceof Error ? error.message : String(error)}`, 'database');
      return [];
    }
  }
}