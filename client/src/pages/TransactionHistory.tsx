import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { DataTable } from "@/components/ui/data-table";
import { Calendar, Download, Filter, PencilIcon, Plus, Trash2 } from "lucide-react";
import { categories } from "@shared/schema";
import { ColumnDef } from "@tanstack/react-table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertTransactionSchema } from "@shared/schema";
import { useIsMobile } from "@/hooks/use-mobile";

export default function TransactionHistory() {
  const [open, setOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch all transactions
  const { data: transactions = [], isLoading, error } = useQuery<any[]>({
    queryKey: ['/api/transactions'],
  });

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

  const handleDeleteTransaction = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this transaction?")) {
      try {
        await apiRequest('DELETE', `/api/transactions/${id}`);
        
        toast({
          title: "Transaction deleted",
          description: "The transaction has been successfully deleted",
        });
        
        queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
        queryClient.invalidateQueries({ queryKey: ['/api/summaries'] });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete transaction",
          variant: "destructive",
        });
      }
    }
  };

  const handleEditTransaction = (transaction: any) => {
    setSelectedTransaction(transaction);
    
    transactionForm.reset({
      date: new Date(transaction.date),
      description: transaction.description,
      category: transaction.category,
      amount: Math.abs(Number(transaction.amount)),
      type: transaction.type,
    });
    
    setOpen(true);
  };

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
      queryClient.invalidateQueries({ queryKey: ['/api/summaries'] });
      setOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save transaction",
        variant: "destructive",
      });
    }
  };

  // Create columns for data table
  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => {
        const date = new Date(row.original.date);
        return format(date, 'MMM d, yyyy');
      },
    },
    {
      accessorKey: "description",
      header: "Description",
    },
    {
      accessorKey: "category",
      header: "Category",
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => {
        const amount = Number(row.original.amount);
        const isIncome = amount > 0;
        return (
          <span className={isIncome ? "text-green-600" : "text-red-600"}>
            {isIncome ? "+" : "-"}${Math.abs(amount).toFixed(2)}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        return (
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost" 
              size="icon"
              onClick={() => handleEditTransaction(row.original)}
            >
              <PencilIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost" 
              size="icon"
              onClick={() => handleDeleteTransaction(row.original.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  // Create category options for filter
  const categoryOptions = categories.map(category => ({
    label: category,
    value: category,
  }));

  // Use our responsive hook instead of directly checking window
  const isMobile = useIsMobile();

  return (
    <div className="flex flex-col h-full">
      {/* Top Navbar */}
      <div className="bg-white shadow-sm z-10">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <h1 className="text-lg font-semibold">Transaction History</h1>
            <div className="flex items-center space-x-2">
              <Button onClick={handleAddTransaction} className="space-x-1">
                {isMobile ? (
                  <Plus className="h-4 w-4" />
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
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
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
            <CardTitle>Transactions</CardTitle>
            <div className="flex items-center space-x-2">
              {!isMobile && (
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  More Filters
                </Button>
              )}
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4" />
                {!isMobile && <span className="ml-2">Export</span>}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-10">Loading transactions...</div>
            ) : error ? (
              <div className="text-center py-10 text-red-500">Failed to load transactions</div>
            ) : (
              <div className="overflow-x-auto">
                <DataTable 
                  columns={columns} 
                  data={transactions || []} 
                  searchColumn="description"
                  filterColumn={{
                    key: "Categories",
                    options: categoryOptions,
                  }}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Add/Edit Transaction Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{selectedTransaction ? "Edit Transaction" : "Add Transaction"}</DialogTitle>
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
