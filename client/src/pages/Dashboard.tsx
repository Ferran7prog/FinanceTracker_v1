import { useState } from "react";
import { SummaryCards } from "@/components/SummaryCards";
import { MonthlyTrendsChart } from "@/components/MonthlyTrendsChart";
import { ExpenseCategoriesChart } from "@/components/ExpenseCategoriesChart";
import { RecentTransactions } from "@/components/RecentTransactions";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus, Calendar, PencilIcon } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useIsMobile } from "@/hooks/use-mobile";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertTransactionSchema, categories } from "@shared/schema";
import { format } from "date-fns";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function Dashboard() {
  // Get current date for initial state
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1); // 1-12
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [open, setOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  // Check if there are any transactions for this month
  const { data: transactions = [] } = useQuery<any[]>({
    queryKey: [`/api/transactions/month/${currentYear}/${currentMonth}`],
  });

  // Display message if no transactions
  const noTransactions = transactions.length === 0;

  const formSchema = insertTransactionSchema.extend({
    date: z.coerce.date(),
    amount: z.coerce.number().min(0, "Amount must be positive"),
    type: z.enum(["income", "expense"]),
  });

  const transactionForm = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: new Date(),
      description: "",
      category: "Other",
      amount: 0,
      type: "expense",
    },
  });

  const handleAddTransaction = () => {
    setSelectedTransaction(null);
    
    transactionForm.reset({
      date: new Date(),
      description: "",
      category: "Other",
      amount: 0,
      type: "expense",
    });
    
    setOpen(true);
  };

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      // Adjust amount based on type
      const amount = data.type === "expense" ? -data.amount : data.amount;
      const submitData = { ...data, amount };
      
      if (selectedTransaction) {
        // Update existing transaction
        await apiRequest('PUT', `/api/transactions/${selectedTransaction.id}`, submitData);
        toast({
          title: "Transaction updated",
          description: "The transaction has been successfully updated",
        });
      } else {
        // Create new transaction
        await apiRequest('POST', '/api/transactions', submitData);
        toast({
          title: "Transaction added",
          description: "The new transaction has been successfully added",
        });
      }
      
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      queryClient.invalidateQueries({ queryKey: [`/api/transactions/month/${currentYear}/${currentMonth}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/summaries'] });
      queryClient.invalidateQueries({ queryKey: [`/api/summaries/${currentYear}/${currentMonth}`] });
      setOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save transaction",
        variant: "destructive",
      });
    }
  };

  const prevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Top Navbar */}
      <div className="bg-white shadow-sm z-10">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="ml-4 md:ml-0">
                <div className="flex items-baseline">
                  <h1 className="text-lg font-semibold">Monthly Overview</h1>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Month Selector */}
              <div className="relative flex items-center">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={prevMonth}
                  className="bg-white p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                {!isMobile ? (
                  <span className="mx-4 text-sm font-medium">
                    {MONTHS[currentMonth - 1]} {currentYear}
                  </span>
                ) : (
                  <span className="mx-2 flex items-center text-sm font-medium">
                    <Calendar className="h-4 w-4 mr-1" />
                    {currentMonth}/{currentYear}
                  </span>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={nextMonth}
                  className="bg-white p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
              
              {/* Add Transaction button */}
              <Button 
                size={isMobile ? "icon" : "default"}
                onClick={handleAddTransaction}
                className="ml-2"
              >
                {isMobile ? (
                  <Plus className="h-4 w-4" />
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-1" />
                    <span>Add Transaction</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-gray-100 p-4 sm:p-6 lg:p-8">
        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Summary Cards */}
          <div className="lg:col-span-3 md:col-span-2">
            <SummaryCards year={currentYear} month={currentMonth} />
          </div>

          {/* Charts */}
          <div className="lg:col-span-2 md:col-span-2">
            <MonthlyTrendsChart year={currentYear} month={currentMonth} />
          </div>
          <div className="lg:col-span-1 md:col-span-1">
            <ExpenseCategoriesChart year={currentYear} month={currentMonth} />
          </div>

          {/* Transactions Table */}
          <div className="lg:col-span-3 md:col-span-2">
            <RecentTransactions year={currentYear} month={currentMonth} />
          </div>
        </div>
      </main>

      {/* Add Transaction Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Transaction</DialogTitle>
          </DialogHeader>
          <Form {...transactionForm}>
            <form onSubmit={transactionForm.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={transactionForm.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <div className="flex">
                        <Calendar className="mr-2 h-4 w-4 opacity-50" />
                        <Input 
                          type="date" 
                          value={field.value ? format(new Date(field.value), 'yyyy-MM-dd') : ''} 
                          onChange={e => field.onChange(new Date(e.target.value))}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={transactionForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Grocery shopping" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={transactionForm.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map(category => (
                          <SelectItem key={category} value={category}>{category}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={transactionForm.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
                          step="0.01" 
                          placeholder="0.00" 
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={transactionForm.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="income">Income</SelectItem>
                          <SelectItem value="expense">Expense</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter>
                <Button type="submit">Save</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
