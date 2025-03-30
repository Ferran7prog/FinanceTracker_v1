import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { getStorage } from "./storage";
import { insertTransactionSchema, insertMonthlySummarySchema, insertCategoryBreakdownSchema, categories } from "@shared/schema";
import { z } from "zod";
// Helper to parse PDF data from buffer
async function extractPdfContent(pdfBuffer: Buffer): Promise<string> {
  try {
    // Import pdf-parse dynamically to avoid issues with test files
    const pdfParse = require('pdf-parse');
    const data = await pdfParse(pdfBuffer);
    return data.text;
  } catch (error) {
    console.error('Error parsing PDF:', error);
    throw new Error('Failed to parse PDF content');
  }
}

// Helper to extract transaction data from text
function extractTransactions(text: string) {
  // In a real app, this would use NLP or pattern matching to extract transactions
  // For this demo, we'll return some placeholder data
  const lines = text.split('\n').filter(line => line.trim().length > 0);
  const transactions = [];
  
  // Very simple pattern matching - in real app would be more sophisticated
  for (const line of lines) {
    // Look for patterns that might indicate transactions
    if (/\$\d+\.\d{2}/.test(line)) {
      const amount = parseFloat(line.match(/\$(\d+\.\d{2})/)?.[1] || '0');
      
      // Try to determine if it's income or expense by context
      const isIncome = /deposit|salary|income|transfer in/i.test(line);
      
      // Try to determine category
      let category = 'Other';
      if (/rent|mortgage|home/i.test(line)) category = 'Housing';
      else if (/car|gas|uber|lyft|transit/i.test(line)) category = 'Transportation';
      else if (/grocery|restaurant|food/i.test(line)) category = 'Food';
      else if (/electric|water|phone|internet/i.test(line)) category = 'Utilities';
      else if (/salary|deposit|income/i.test(line)) category = 'Income';
      
      transactions.push({
        date: new Date(),
        description: line.trim().substring(0, 100),
        category,
        amount: isIncome ? amount : -amount,
        type: isIncome ? 'income' : 'expense'
      });
    }
  }
  
  return transactions;
}

// Helper to generate monthly summaries from transactions
async function generateMonthlySummary(userId: number, year: number, month: number) {
  const storage = await getStorage();
  const transactions = await storage.getTransactionsByMonth(userId, year, month);
  
  if (transactions.length === 0) {
    return null;
  }
  
  const totalIncome = transactions
    .filter((t: any) => t.type === 'income')
    .reduce((sum: number, t: any) => sum + Number(t.amount), 0);
    
  const totalExpenses = transactions
    .filter((t: any) => t.type === 'expense')
    .reduce((sum: number, t: any) => sum + Number(Math.abs(t.amount)), 0);
    
  const netBalance = totalIncome - totalExpenses;
  
  // Create or update monthly summary
  const summary = await storage.createOrUpdateMonthlySummary(userId, {
    year,
    month,
    totalIncome,
    totalExpenses,
    netBalance
  });
  
  // Generate category breakdowns
  const expensesByCategory = new Map<string, number>();
  
  // Initialize all categories with zero
  categories.forEach(cat => expensesByCategory.set(cat, 0));
  
  // Sum expenses by category
  transactions
    .filter((t: any) => t.type === 'expense')
    .forEach((t: any) => {
      const currentAmount = expensesByCategory.get(t.category) || 0;
      expensesByCategory.set(t.category, currentAmount + Number(Math.abs(t.amount)));
    });
  
  // Convert to array of category breakdowns
  const breakdowns = Array.from(expensesByCategory.entries())
    .filter(([_, amount]) => amount > 0)
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: (amount / totalExpenses) * 100
    }));
  
  // Update category breakdowns
  await storage.updateCategoryBreakdowns(summary.id, breakdowns);
  
  return summary;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // API Routes
  // ===========
  
  // Transaction Routes
  app.get('/api/transactions', async (req: Request, res: Response) => {
    try {
      // In a real app, this would get the user ID from the authenticated session
      const userId = 1; // Using default demo user
      const storage = await getStorage();
      const transactions = await storage.getTransactions(userId);
      res.json(transactions);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Failed to fetch transactions' });
    }
  });
  
  app.get('/api/transactions/month/:year/:month', async (req: Request, res: Response) => {
    try {
      const userId = 1; // Using default demo user
      const year = parseInt(req.params.year);
      const month = parseInt(req.params.month);
      
      if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
        return res.status(400).json({ message: 'Invalid year or month' });
      }
      
      const storage = await getStorage();
      const transactions = await storage.getTransactionsByMonth(userId, year, month);
      res.json(transactions);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Failed to fetch transactions' });
    }
  });
  
  app.post('/api/transactions', async (req: Request, res: Response) => {
    try {
      const userId = 1; // Using default demo user
      const validatedData = insertTransactionSchema.parse(req.body);
      const storage = await getStorage();
      const transaction = await storage.createTransaction(userId, validatedData);
      
      // Update monthly summary after adding a transaction
      const transactionDate = new Date(transaction.date);
      await generateMonthlySummary(
        userId, 
        transactionDate.getFullYear(), 
        transactionDate.getMonth() + 1
      );
      
      res.status(201).json(transaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid transaction data', errors: error.errors });
      }
      console.error(error);
      res.status(500).json({ message: 'Failed to create transaction' });
    }
  });
  
  app.put('/api/transactions/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid transaction ID' });
      }
      
      const storage = await getStorage();
      const transaction = await storage.getTransactionById(id);
      
      if (!transaction) {
        return res.status(404).json({ message: 'Transaction not found' });
      }
      
      const validatedData = insertTransactionSchema.partial().parse(req.body);
      const updatedTransaction = await storage.updateTransaction(id, validatedData);
      
      // Update monthly summary after modifying a transaction
      const transactionDate = new Date(updatedTransaction?.date || transaction.date);
      await generateMonthlySummary(
        transaction.userId, 
        transactionDate.getFullYear(), 
        transactionDate.getMonth() + 1
      );
      
      res.json(updatedTransaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid transaction data', errors: error.errors });
      }
      console.error(error);
      res.status(500).json({ message: 'Failed to update transaction' });
    }
  });
  
  app.delete('/api/transactions/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid transaction ID' });
      }
      
      const storage = await getStorage();
      const transaction = await storage.getTransactionById(id);
      
      if (!transaction) {
        return res.status(404).json({ message: 'Transaction not found' });
      }
      
      const success = await storage.deleteTransaction(id);
      
      if (success) {
        // Update monthly summary after deleting a transaction
        const transactionDate = new Date(transaction.date);
        await generateMonthlySummary(
          transaction.userId, 
          transactionDate.getFullYear(), 
          transactionDate.getMonth() + 1
        );
        
        res.status(204).end();
      } else {
        res.status(500).json({ message: 'Failed to delete transaction' });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Failed to delete transaction' });
    }
  });
  
  // Monthly Summary Routes
  app.get('/api/summaries', async (req: Request, res: Response) => {
    try {
      const userId = 1; // Using default demo user
      const storage = await getStorage();
      const summaries = await storage.getMonthlySummaries(userId);
      res.json(summaries);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Failed to fetch monthly summaries' });
    }
  });
  
  app.get('/api/summaries/:year/:month', async (req: Request, res: Response) => {
    try {
      const userId = 1; // Using default demo user
      const year = parseInt(req.params.year);
      const month = parseInt(req.params.month);
      
      if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
        return res.status(400).json({ message: 'Invalid year or month' });
      }
      
      const storage = await getStorage();
      const summary = await storage.getMonthlySummaryByMonth(userId, year, month);
      
      if (!summary) {
        return res.status(404).json({ message: 'Summary not found for this month' });
      }
      
      // Get category breakdowns
      const breakdowns = await storage.getCategoryBreakdowns(summary.id);
      
      res.json({ summary, breakdowns });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Failed to fetch monthly summary' });
    }
  });
  
  // PDF Upload and Processing
  app.post('/api/upload-statement', async (req: Request, res: Response) => {
    try {
      if (!req.body || !req.body.pdfContent) {
        return res.status(400).json({ message: 'No PDF content provided' });
      }
      
      const userId = 1; // Using default demo user
      const pdfContent = req.body.pdfContent;
      
      // For base64 encoded pdf content
      const pdfBuffer = Buffer.from(pdfContent, 'base64');
      
      // Extract text from PDF
      const extractedText = await extractPdfContent(pdfBuffer);
      
      // Extract transactions from text
      const extractedTransactions = extractTransactions(extractedText);
      
      if (extractedTransactions.length === 0) {
        return res.status(400).json({ 
          message: 'No transactions could be extracted from the PDF. Please check the format or try manual entry.' 
        });
      }
      
      // Save transactions
      const storage = await getStorage();
      const savedTransactions = [];
      for (const transaction of extractedTransactions) {
        const transactionData = insertTransactionSchema.parse({
          ...transaction,
          pdfSource: 'Uploaded PDF'
        });
        
        savedTransactions.push(
          await storage.createTransaction(userId, transactionData)
        );
      }
      
      // Generate summary for the month of the transactions
      const firstDate = new Date(savedTransactions[0].date);
      const year = firstDate.getFullYear();
      const month = firstDate.getMonth() + 1;
      
      const summary = await generateMonthlySummary(userId, year, month);
      
      res.status(201).json({
        message: `Successfully extracted ${savedTransactions.length} transactions`,
        transactions: savedTransactions,
        summary
      });
    } catch (error) {
      console.error('PDF processing error:', error);
      res.status(500).json({ message: 'Failed to process PDF' });
    }
  });
  
  // Categories
  app.get('/api/categories', (req: Request, res: Response) => {
    res.json(categories);
  });
  
  // Export data to CSV
  app.get('/api/export/:year/:month', async (req: Request, res: Response) => {
    try {
      const userId = 1; // Using default demo user
      const year = parseInt(req.params.year);
      const month = parseInt(req.params.month);
      
      if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
        return res.status(400).json({ message: 'Invalid year or month' });
      }
      
      const storage = await getStorage();
      const transactions = await storage.getTransactionsByMonth(userId, year, month);
      
      if (transactions.length === 0) {
        return res.status(404).json({ message: 'No transactions found for this month' });
      }
      
      // Generate CSV content
      const headers = ['Date', 'Description', 'Category', 'Amount', 'Type'];
      const csvRows = [headers.join(',')];
      
      for (const transaction of transactions) {
        // Format date as MM/DD/YYYY
        const date = new Date(transaction.date);
        const formattedDate = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
        
        // Escape commas and quotes in description
        const safeDescription = transaction.description.replace(/"/g, '""');
        
        const row = [
          formattedDate,
          `"${safeDescription}"`,
          transaction.category,
          Math.abs(Number(transaction.amount)).toFixed(2),
          transaction.type
        ];
        
        csvRows.push(row.join(','));
      }
      
      const csvContent = csvRows.join('\n');
      
      // Set headers to trigger download
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=transactions-${year}-${month}.csv`);
      
      res.send(csvContent);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Failed to export transactions' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
