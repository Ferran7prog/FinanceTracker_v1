import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

interface MonthlyTrendsChartProps {
  year: number;
  month: number;
}

export function MonthlyTrendsChart({ year, month }: MonthlyTrendsChartProps) {
  // Query to fetch monthly summaries for the last 6 months
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/summaries'],
  }) as { data: any[], isLoading: boolean, error: any };

  if (isLoading) {
    return <MonthlyTrendsChartSkeleton />;
  }

  if (error || !data) {
    return (
      <Card className="col-span-1 lg:col-span-2 bg-white rounded-lg shadow">
        <CardHeader>
          <CardTitle>Monthly Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-72">
            <p className="text-red-500">Failed to load monthly trends data</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Process data for chart
  // Get last 6 months including current
  const currentDate = new Date(year, month - 1);
  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const date = new Date(currentDate);
    date.setMonth(date.getMonth() - (5 - i));
    return {
      month: MONTHS[date.getMonth()],
      year: date.getFullYear(),
      monthNum: date.getMonth() + 1,
      current: i === 5, // Is this the current month?
    };
  });

  // Match monthly data
  const chartData = last6Months.map(monthData => {
    const summaryData = data.find(
      (s: any) => s.year === monthData.year && s.month === monthData.monthNum
    );

    return {
      name: monthData.month,
      income: summaryData ? Number(summaryData.totalIncome) : 0,
      expenses: summaryData ? Number(summaryData.totalExpenses) : 0,
      savings: summaryData ? Math.max(0, Number(summaryData.netBalance)) : 0,
      current: monthData.current,
    };
  });



  return (
    <Card className="col-span-1 lg:col-span-2 bg-white rounded-lg shadow">
      <CardHeader className="pb-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium text-gray-900">Monthly Trends</CardTitle>
          <div className="flex space-x-3">
            <div className="flex items-center">
              <div className="h-3 w-3 rounded-full bg-primary mr-1"></div>
              <span className="text-xs text-gray-500">Income</span>
            </div>
            <div className="flex items-center">
              <div className="h-3 w-3 rounded-full bg-red-500 mr-1"></div>
              <span className="text-xs text-gray-500">Expenses</span>
            </div>
            <div className="flex items-center">
              <div className="h-3 w-3 rounded-full bg-green-500 mr-1"></div>
              <span className="text-xs text-gray-500">Savings</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="h-72 bg-gray-50 rounded-lg flex items-center justify-center relative overflow-hidden">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis 
                tickFormatter={(value) => `$${value.toLocaleString()}`}
                width={80}
              />
              <Tooltip 
                formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                contentStyle={{ borderRadius: '4px' }}
              />
              <Legend />
              <Bar dataKey="income" fill="hsl(222.2,47.4%,11.2%)" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`income-${index}`} fillOpacity={entry.current ? 1 : 0.7} />
                ))}
              </Bar>
              <Bar dataKey="expenses" fill="#ef4444" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`expenses-${index}`} fillOpacity={entry.current ? 1 : 0.7} />
                ))}
              </Bar>
              <Bar dataKey="savings" fill="#22c55e" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`savings-${index}`} fillOpacity={entry.current ? 1 : 0.7} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4">
          <div className="text-sm text-gray-500">
            Last 6 months
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MonthlyTrendsChartSkeleton() {
  return (
    <Card className="col-span-1 lg:col-span-2 bg-white rounded-lg shadow">
      <CardHeader className="pb-0">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-40" />
          <div className="flex space-x-3">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <Skeleton className="h-72 w-full rounded-lg" />
        <div className="mt-4">
          <Skeleton className="h-4 w-24" />
        </div>
      </CardContent>
    </Card>
  );
}
