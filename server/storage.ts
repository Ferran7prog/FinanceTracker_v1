import {
  User,
  InsertUser,
  Transaction,
  InsertTransaction,
  MonthlySummary,
  InsertMonthlySummary,
  CategoryBreakdown,
  InsertCategoryBreakdown,
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Transaction methods
  getTransactions(userId: number): Promise<Transaction[]>;
  getTransactionsByMonth(userId: number, year: number, month: number): Promise<Transaction[]>;
  getTransactionById(id: number): Promise<Transaction | undefined>;
  createTransaction(userId: number, transaction: InsertTransaction): Promise<Transaction>;
  updateTransaction(id: number, transaction: Partial<InsertTransaction>): Promise<Transaction | undefined>;
  deleteTransaction(id: number): Promise<boolean>;

  // Monthly Summary methods
  getMonthlySummaries(userId: number): Promise<MonthlySummary[]>;
  getMonthlySummaryByMonth(userId: number, year: number, month: number): Promise<MonthlySummary | undefined>;
  createOrUpdateMonthlySummary(userId: number, summary: InsertMonthlySummary): Promise<MonthlySummary>;

  // Category Breakdown methods
  getCategoryBreakdowns(summaryId: number): Promise<CategoryBreakdown[]>;
  createCategoryBreakdown(summaryId: number, breakdown: InsertCategoryBreakdown): Promise<CategoryBreakdown>;
  updateCategoryBreakdowns(summaryId: number, breakdowns: InsertCategoryBreakdown[]): Promise<CategoryBreakdown[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private transactions: Map<number, Transaction>;
  private monthlySummaries: Map<number, MonthlySummary>;
  private categoryBreakdowns: Map<number, CategoryBreakdown>;
  
  private userId: number;
  private transactionId: number;
  private summaryId: number;
  private breakdownId: number;

  constructor() {
    this.users = new Map();
    this.transactions = new Map();
    this.monthlySummaries = new Map();
    this.categoryBreakdowns = new Map();
    
    this.userId = 1;
    this.transactionId = 1;
    this.summaryId = 1;
    this.breakdownId = 1;

    // Create a default user for demo purposes
    this.createUser({ username: "demo", password: "password" });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Transaction methods
  async getTransactions(userId: number): Promise<Transaction[]> {
    return Array.from(this.transactions.values()).filter(
      (transaction) => transaction.userId === userId,
    );
  }

  async getTransactionsByMonth(userId: number, year: number, month: number): Promise<Transaction[]> {
    return Array.from(this.transactions.values()).filter(
      (transaction) => {
        const transactionDate = new Date(transaction.date);
        return (
          transaction.userId === userId &&
          transactionDate.getFullYear() === year &&
          transactionDate.getMonth() === month - 1
        );
      }
    );
  }

  async getTransactionById(id: number): Promise<Transaction | undefined> {
    return this.transactions.get(id);
  }

  async createTransaction(userId: number, insertTransaction: InsertTransaction): Promise<Transaction> {
    const id = this.transactionId++;
    // Format the date as string for consistency with the PostgresStorage implementation
    const transaction: Transaction = {
      id,
      userId,
      date: insertTransaction.date.toISOString().split('T')[0],
      type: insertTransaction.type,
      description: insertTransaction.description,
      category: insertTransaction.category,
      amount: String(insertTransaction.amount),
      pdfSource: insertTransaction.pdfSource || null,
      createdAt: new Date(),
    };
    this.transactions.set(id, transaction);
    return transaction;
  }

  async updateTransaction(id: number, updateData: Partial<InsertTransaction>): Promise<Transaction | undefined> {
    const transaction = this.transactions.get(id);
    if (!transaction) return undefined;
    
    // Create a new object with proper type conversions
    const updatedTransaction: Transaction = { ...transaction };
    
    // Update fields with proper type conversions
    if (updateData.date !== undefined) {
      updatedTransaction.date = updateData.date.toISOString().split('T')[0];
    }
    
    if (updateData.amount !== undefined) {
      updatedTransaction.amount = String(updateData.amount);
    }
    
    if (updateData.description !== undefined) {
      updatedTransaction.description = updateData.description;
    }
    
    if (updateData.category !== undefined) {
      updatedTransaction.category = updateData.category;
    }
    
    if (updateData.type !== undefined) {
      updatedTransaction.type = updateData.type;
    }
    
    if (updateData.pdfSource !== undefined) {
      updatedTransaction.pdfSource = updateData.pdfSource;
    }
    
    this.transactions.set(id, updatedTransaction);
    return updatedTransaction;
  }

  async deleteTransaction(id: number): Promise<boolean> {
    return this.transactions.delete(id);
  }

  // Monthly Summary methods
  async getMonthlySummaries(userId: number): Promise<MonthlySummary[]> {
    return Array.from(this.monthlySummaries.values()).filter(
      (summary) => summary.userId === userId,
    );
  }

  async getMonthlySummaryByMonth(userId: number, year: number, month: number): Promise<MonthlySummary | undefined> {
    return Array.from(this.monthlySummaries.values()).find(
      (summary) => 
        summary.userId === userId && 
        summary.year === year && 
        summary.month === month
    );
  }

  async createOrUpdateMonthlySummary(userId: number, summaryData: InsertMonthlySummary): Promise<MonthlySummary> {
    const existing = await this.getMonthlySummaryByMonth(userId, summaryData.year, summaryData.month);
    
    // Convert numeric values to strings for consistency with PostgreSQL
    const dbData = {
      year: summaryData.year,
      month: summaryData.month,
      totalIncome: String(summaryData.totalIncome),
      totalExpenses: String(summaryData.totalExpenses),
      netBalance: String(summaryData.netBalance)
    };
    
    if (existing) {
      const updatedSummary: MonthlySummary = { 
        ...existing,
        year: dbData.year,
        month: dbData.month,
        totalIncome: dbData.totalIncome,
        totalExpenses: dbData.totalExpenses,
        netBalance: dbData.netBalance,
        lastUpdated: new Date() 
      };
      this.monthlySummaries.set(existing.id, updatedSummary);
      return updatedSummary;
    }
    
    const id = this.summaryId++;
    const summary: MonthlySummary = {
      id,
      userId,
      year: dbData.year,
      month: dbData.month,
      totalIncome: dbData.totalIncome,
      totalExpenses: dbData.totalExpenses,
      netBalance: dbData.netBalance,
      lastUpdated: new Date(),
    };
    this.monthlySummaries.set(id, summary);
    return summary;
  }

  // Category Breakdown methods
  async getCategoryBreakdowns(summaryId: number): Promise<CategoryBreakdown[]> {
    return Array.from(this.categoryBreakdowns.values()).filter(
      (breakdown) => breakdown.summaryId === summaryId,
    );
  }

  async createCategoryBreakdown(summaryId: number, breakdownData: InsertCategoryBreakdown): Promise<CategoryBreakdown> {
    const id = this.breakdownId++;
    
    // Convert numeric values to strings for consistency with PostgreSQL
    const breakdown: CategoryBreakdown = {
      id,
      summaryId,
      category: breakdownData.category,
      amount: String(breakdownData.amount),
      percentage: String(breakdownData.percentage)
    };
    
    this.categoryBreakdowns.set(id, breakdown);
    return breakdown;
  }

  async updateCategoryBreakdowns(summaryId: number, breakdowns: InsertCategoryBreakdown[]): Promise<CategoryBreakdown[]> {
    // Delete existing breakdowns for this summary
    Array.from(this.categoryBreakdowns.values())
      .filter(breakdown => breakdown.summaryId === summaryId)
      .forEach(breakdown => this.categoryBreakdowns.delete(breakdown.id));
    
    // Create new breakdowns
    const results: CategoryBreakdown[] = [];
    for (const breakdown of breakdowns) {
      results.push(await this.createCategoryBreakdown(summaryId, breakdown));
    }
    
    return results;
  }
}

import { PostgresStorage } from './db-storage';
import { log } from './vite';

// Storage factory function to decide which storage implementation to use
async function createStorage(): Promise<IStorage> {
  if (process.env.DATABASE_URL) {
    try {
      // Try to use PostgreSQL storage
      const pgStorage = new PostgresStorage();
      
      // Test connection by trying to get a user
      await pgStorage.getUserByUsername('demo');
      
      log('Using PostgreSQL storage for data persistence', 'storage');
      return pgStorage;
    } catch (error) {
      log(`Failed to initialize PostgreSQL storage: ${error instanceof Error ? error.message : String(error)}`, 'storage');
      log('Falling back to in-memory storage', 'storage');
    }
  } else {
    log('No DATABASE_URL provided, using in-memory storage', 'storage');
  }
  
  // Fall back to in-memory storage
  return new MemStorage();
}

// Create storage instance
let storageInstance: IStorage | null = null;

export async function getStorage(): Promise<IStorage> {
  if (!storageInstance) {
    storageInstance = await createStorage();
    
    // Create a default user if using Postgres
    if (storageInstance instanceof PostgresStorage) {
      const existingUser = await storageInstance.getUserByUsername('demo');
      if (!existingUser) {
        await storageInstance.createUser({ username: 'demo', password: 'password' });
        log('Created default demo user in PostgreSQL', 'storage');
      }
    }
  }
  return storageInstance;
}

// For backwards compatibility
export const storage = new MemStorage();
