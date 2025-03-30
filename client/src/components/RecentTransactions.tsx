import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTable } from "@/components/ui/data-table";
import { ArrowDown, ArrowUp, Check, Home, Car, ShoppingBag, Zap, Building } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { categories } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

interface RecentTransactionsProps {
  year: number;
  month: number;
}

export function RecentTransactions({ year, month }: RecentTransactionsProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: [`/api/transactions/month/${year}/${month}`],
  });

  const categoryOptions = categories.map(category => ({
    label: category,
    value: category,
  }));

  // Icon mapping for different categories
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Housing':
        return <Home className="text-blue-500" />;
      case 'Transportation':
        return <Car className="text-purple-500" />;
      case 'Food':
        return <ShoppingBag className="text-yellow-500" />;
      case 'Utilities':
        return <Zap className="text-red-500" />;
      case 'Income':
        return <Building className="text-green-500" />;
      default:
        return <ShoppingBag className="text-gray-500" />;
    }
  };

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => {
        const date = new Date(row.original.date);
        return (
          <div className="text-sm text-gray-500">
            {date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
          </div>
        );
      },
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => {
        const category = row.original.category;
        return (
          <div className="flex items-center">
            <div className="flex-shrink-0 h-8 w-8 rounded bg-blue-100 flex items-center justify-center">
              {getCategoryIcon(category)}
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-900">
                {row.original.description}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => (
        <div className="text-sm text-gray-900">{row.original.category}</div>
      ),
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => {
        const amount = Number(row.original.amount);
        const isIncome = row.original.type === "income";
        return (
          <div className={`text-sm font-medium ${isIncome ? 'text-green-600' : 'text-red-600'}`}>
            {isIncome ? '+' : '-'}${Math.abs(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: () => (
        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
          <Check className="h-3 w-3 mr-1" /> Processed
        </span>
      ),
    },
  ];

  if (isLoading) {
    return <RecentTransactionsSkeleton />;
  }

  if (error) {
    return (
      <Card className="col-span-1 lg:col-span-3 bg-white shadow rounded-lg overflow-hidden">
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 text-center">
            <p className="text-red-500">Failed to load transaction data</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-1 lg:col-span-3 bg-white shadow rounded-lg overflow-hidden">
      <CardHeader className="px-6 py-5 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium text-gray-900">Recent Transactions</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <DataTable 
          columns={columns} 
          data={data || []} 
          searchColumn="description"
          filterColumn={{
            key: "Categories",
            options: categoryOptions,
          }}
        />
      </CardContent>
    </Card>
  );
}

function RecentTransactionsSkeleton() {
  return (
    <Card className="col-span-1 lg:col-span-3 bg-white shadow rounded-lg overflow-hidden">
      <CardHeader className="px-6 py-5 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-48" />
          <div className="flex space-x-3">
            <Skeleton className="h-9 w-40" />
            <Skeleton className="h-9 w-20" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <div className="flex justify-between">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-8 w-64" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
