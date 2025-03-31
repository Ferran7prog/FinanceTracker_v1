import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

const COLORS = ["#ef4444", "#3b82f6", "#22c55e", "#eab308", "#a855f7", "#ec4899", "#14b8a6", "#f97316"];

interface ExpenseCategoriesChartProps {
  year: number;
  month: number;
}

export function ExpenseCategoriesChart({ year, month }: ExpenseCategoriesChartProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: [`/api/summaries/${year}/${month}`],
    // Don't throw on 404 errors since we want to display an empty chart for months with no data
    throwOnError: false,
  });

  if (isLoading) {
    return <ExpenseCategoriesChartSkeleton />;
  }

  // Define type for breakdown
  interface Breakdown {
    category: string;
    amount: number;
    percentage: number;
  }
  
  // Use empty breakdowns array if there's no data (or no breakdowns)
  const breakdowns: Breakdown[] = data && 
    typeof data === 'object' && 
    data !== null && 
    'breakdowns' in data && 
    Array.isArray(data.breakdowns)
    ? data.breakdowns
    : [];
  
  // Filter to only include expense categories with amounts > 0
  const expenseCategories = breakdowns
    .filter((b: any) => b.amount > 0)
    .map((b: any, index: number) => ({
      name: b.category,
      value: Number(b.amount),
      percentage: Number(b.percentage).toFixed(0),
      color: COLORS[index % COLORS.length]
    }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border rounded shadow text-sm">
          <p className="font-medium">{payload[0].name}</p>
          <p className="text-gray-700">${payload[0].value.toLocaleString()}</p>
          <p className="text-gray-500">{payload[0].payload.percentage}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="bg-white overflow-hidden shadow rounded-lg">
      <CardHeader>
        <CardTitle className="text-lg font-medium text-gray-900">Expense Categories</CardTitle>
      </CardHeader>
      <CardContent>
        {expenseCategories.length > 0 ? (
          <>
            <div className="h-52 relative mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseCategories}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {expenseCategories.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              {expenseCategories.map((category: any, index: number) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center">
                    <div 
                      className="h-3 w-3 rounded-full mr-2" 
                      style={{ backgroundColor: category.color }}
                    ></div>
                    <span className="text-gray-700">{category.name}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-900">
                      ${Number(category.value).toLocaleString()}
                    </span>
                    <span className="text-gray-500 ml-1">{category.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-52">
            <p className="text-gray-500">No expense data available for this month</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ExpenseCategoriesChartSkeleton() {
  return (
    <Card className="bg-white overflow-hidden shadow rounded-lg">
      <CardHeader>
        <Skeleton className="h-6 w-40" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-52 w-full mb-4 rounded" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-full" />
        </div>
      </CardContent>
    </Card>
  );
}
