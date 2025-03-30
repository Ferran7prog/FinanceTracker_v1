import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { BarChart, PieChart, Pie, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer, Legend } from "recharts";
import { Download, FileDown, Calendar } from "lucide-react";
import { useState } from "react";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const FULL_MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const COLORS = ["#ef4444", "#3b82f6", "#22c55e", "#eab308", "#a855f7", "#ec4899", "#14b8a6", "#f97316"];

export default function Reports() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  
  // Fetch all summaries for the year
  const { data: summaries, isLoading } = useQuery({
    queryKey: ['/api/summaries'],
  });

  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto bg-gray-100 p-4 sm:p-6 lg:p-8">
        <div className="text-center py-10">Loading reports...</div>
      </div>
    );
  }

  // Process data for annual overview
  const annualData = MONTHS.map((month, index) => {
    const monthSummary = summaries?.find(
      (s: any) => s.year === selectedYear && s.month === index + 1
    );
    
    return {
      name: month,
      income: monthSummary ? Number(monthSummary.totalIncome) : 0,
      expenses: monthSummary ? Number(monthSummary.totalExpenses) : 0,
      savings: monthSummary ? Math.max(0, Number(monthSummary.netBalance)) : 0,
    };
  });

  // Calculate annual totals
  const annualIncome = annualData.reduce((sum, month) => sum + month.income, 0);
  const annualExpenses = annualData.reduce((sum, month) => sum + month.expenses, 0);
  const annualSavings = annualData.reduce((sum, month) => sum + month.savings, 0);
  const savingsRate = annualIncome > 0 ? (annualSavings / annualIncome) * 100 : 0;

  // Get category breakdown for the year
  const categorySums: Record<string, number> = {};
  
  summaries?.forEach((summary: any) => {
    if (summary.year === selectedYear) {
      // For each month summary, get its category breakdowns
      fetch(`/api/summaries/${summary.year}/${summary.month}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.breakdowns) {
            data.breakdowns.forEach((breakdown: any) => {
              const category = breakdown.category;
              const amount = Number(breakdown.amount);
              categorySums[category] = (categorySums[category] || 0) + amount;
            });
          }
        });
    }
  });

  const categoryData = Object.entries(categorySums).map(([category, amount], index) => ({
    name: category,
    value: amount,
    color: COLORS[index % COLORS.length]
  }));

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };

  // Handle export
  const handleExportAnnual = () => {
    // This would generate a PDF or CSV report in a real app
    alert('Annual report export would be implemented here');
  };

  return (
    <>
      {/* Top Navbar */}
      <div className="bg-white shadow-sm z-10">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <h1 className="text-lg font-semibold">Financial Reports</h1>
            <div className="flex items-center space-x-2">
              <div className="flex items-center">
                <Calendar className="mr-2 h-4 w-4" />
                <select 
                  className="bg-white border border-gray-300 rounded-md py-1 px-3 text-sm"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                >
                  {[...Array(5)].map((_, i) => (
                    <option key={i} value={currentYear - i}>
                      {currentYear - i}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-gray-100 p-4 sm:p-6 lg:p-8">
        <Tabs defaultValue="annual" className="space-y-6">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
            <TabsTrigger value="annual">Annual Overview</TabsTrigger>
            <TabsTrigger value="monthly">Monthly Breakdown</TabsTrigger>
          </TabsList>

          <TabsContent value="annual" className="space-y-6">
            {/* Annual Summary Cards */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Annual Income</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(annualIncome)}</div>
                  <p className="text-xs text-gray-500 mt-1">Total earnings for {selectedYear}</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Annual Expenses</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(annualExpenses)}</div>
                  <p className="text-xs text-gray-500 mt-1">Total spent in {selectedYear}</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Savings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(annualSavings)}</div>
                  <p className="text-xs text-gray-500 mt-1">Total saved in {selectedYear}</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Savings Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{savingsRate.toFixed(1)}%</div>
                  <p className="text-xs text-gray-500 mt-1">Of total income</p>
                </CardContent>
              </Card>
            </div>

            {/* Annual Charts */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Income vs. Expenses ({selectedYear})</CardTitle>
                  <Button variant="outline" size="sm" onClick={handleExportAnnual}>
                    <FileDown className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={annualData}
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
                          tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                          width={60}
                        />
                        <Tooltip 
                          formatter={(value: number) => [formatCurrency(value), '']}
                          contentStyle={{ borderRadius: '4px' }}
                        />
                        <Legend />
                        <Bar dataKey="income" name="Income" fill="hsl(222.2,47.4%,11.2%)" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Expense Categories ({selectedYear})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="value"
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                          labelLine={false}
                        >
                          {categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value: number) => [formatCurrency(value), '']}
                          contentStyle={{ borderRadius: '4px' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="monthly" className="space-y-6">
            {/* Monthly Reports List */}
            <Card>
              <CardHeader>
                <CardTitle>Monthly Reports for {selectedYear}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {FULL_MONTHS.map((month, index) => {
                    const monthData = summaries?.find(
                      (s: any) => s.year === selectedYear && s.month === index + 1
                    );
                    
                    return (
                      <div key={month} className="p-4 border rounded-md flex justify-between items-center">
                        <div>
                          <h3 className="font-medium">{month} {selectedYear}</h3>
                          {monthData ? (
                            <div className="text-sm text-gray-500 mt-1">
                              Income: {formatCurrency(Number(monthData.totalIncome))} | 
                              Expenses: {formatCurrency(Number(monthData.totalExpenses))}
                            </div>
                          ) : (
                            <div className="text-sm text-gray-500 mt-1">No data available</div>
                          )}
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          disabled={!monthData}
                          onClick={() => window.open(`/api/export/${selectedYear}/${index + 1}`, '_blank')}
                        >
                          <Download className="h-4 w-4 mr-2" /> 
                          Export
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </>
  );
}
