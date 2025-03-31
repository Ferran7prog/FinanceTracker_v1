import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { ArrowDown, ArrowUp, Wallet } from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

interface SummaryProps {
  year: number;
  month: number;
}

export function SummaryCards({ year, month }: SummaryProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: [`/api/summaries/${year}/${month}`],
    // Don't throw on 404 errors since we want to display zeros for months with no data
    throwOnError: false,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryCardSkeleton />
        <SummaryCardSkeleton />
        <SummaryCardSkeleton />
      </div>
    );
  }

  // Define type for summary
  interface SummaryData {
    totalIncome: string;
    totalExpenses: string;
    netBalance: string;
  }
  
  // Get summary data or use default values (zeros) if not available
  const summary: SummaryData = data && 
    typeof data === 'object' && 
    data !== null &&
    'summary' in data &&
    data.summary && 
    typeof data.summary === 'object' &&
    data.summary !== null
    ? data.summary as SummaryData
    : {
        totalIncome: '0',
        totalExpenses: '0',
        netBalance: '0'
      };

  // Calculate percentages for the month (these would be fetched from API in real app)
  const incomeChange = 8.2; // Example value, would be dynamic in real implementation
  const expenseChange = 3.5; // Example value, would be dynamic in real implementation
  const balanceChange = 25.3; // Example value, would be dynamic in real implementation

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {/* Total Income Card */}
      <Card className="bg-white shadow rounded-lg overflow-hidden">
        <CardContent className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
              <ArrowDown className="text-green-600 h-5 w-5" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Total Income
                </dt>
                <dd className="flex items-baseline">
                  <div className="text-2xl font-semibold text-gray-900">
                    ${Number(summary.totalIncome || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                    <ArrowUp className="mr-0.5 flex-shrink-0 self-center h-4 w-4" />
                    <span>{incomeChange}%</span>
                  </div>
                </dd>
              </dl>
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-gray-50 px-5 py-3">
          <div className="text-sm">
            <Link href="/transactions" className="font-medium text-primary hover:text-primary/80">
              View details <ArrowDown className="inline ml-1 h-3 w-3 rotate-90" />
            </Link>
          </div>
        </CardFooter>
      </Card>

      {/* Total Expenses Card */}
      <Card className="bg-white shadow rounded-lg overflow-hidden">
        <CardContent className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-red-100 rounded-md p-3">
              <ArrowUp className="text-red-600 h-5 w-5" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Total Expenses
                </dt>
                <dd className="flex items-baseline">
                  <div className="text-2xl font-semibold text-gray-900">
                    ${Number(summary.totalExpenses || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="ml-2 flex items-baseline text-sm font-semibold text-red-600">
                    <ArrowUp className="mr-0.5 flex-shrink-0 self-center h-4 w-4" />
                    <span>{expenseChange}%</span>
                  </div>
                </dd>
              </dl>
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-gray-50 px-5 py-3">
          <div className="text-sm">
            <Link href="/transactions" className="font-medium text-primary hover:text-primary/80">
              View details <ArrowDown className="inline ml-1 h-3 w-3 rotate-90" />
            </Link>
          </div>
        </CardFooter>
      </Card>

      {/* Net Balance Card */}
      <Card className="bg-white shadow rounded-lg overflow-hidden">
        <CardContent className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
              <Wallet className="text-blue-600 h-5 w-5" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Net Balance
                </dt>
                <dd className="flex items-baseline">
                  <div className="text-2xl font-semibold text-gray-900">
                    ${Number(summary.netBalance || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                    <ArrowUp className="mr-0.5 flex-shrink-0 self-center h-4 w-4" />
                    <span>{balanceChange}%</span>
                  </div>
                </dd>
              </dl>
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-gray-50 px-5 py-3">
          <div className="text-sm">
            <Link href="/transactions" className="font-medium text-primary hover:text-primary/80">
              View details <ArrowDown className="inline ml-1 h-3 w-3 rotate-90" />
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

function SummaryCardSkeleton() {
  return (
    <Card className="bg-white shadow rounded-lg overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-center">
          <Skeleton className="h-12 w-12 rounded-md" />
          <div className="ml-5 w-0 flex-1">
            <Skeleton className="h-4 w-24 mb-2" />
            <div className="flex items-baseline">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="ml-2 h-4 w-12" />
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="bg-gray-50 px-5 py-3">
        <Skeleton className="h-4 w-24" />
      </CardFooter>
    </Card>
  );
}
