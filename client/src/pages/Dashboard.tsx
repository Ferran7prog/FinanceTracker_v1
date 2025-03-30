import { useState } from "react";
import { SummaryCards } from "@/components/SummaryCards";
import { MonthlyTrendsChart } from "@/components/MonthlyTrendsChart";
import { ExpenseCategoriesChart } from "@/components/ExpenseCategoriesChart";
import { RecentTransactions } from "@/components/RecentTransactions";
import { UploadWidget } from "@/components/UploadWidget";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus, Calendar } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useIsMobile } from "@/hooks/use-mobile";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function Dashboard() {
  // Get current date for initial state
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1); // 1-12
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [showUploadWidget, setShowUploadWidget] = useState(false);
  const isMobile = useIsMobile();

  // Check if there are any transactions for this month
  const { data: transactions = [] } = useQuery<any[]>({
    queryKey: [`/api/transactions/month/${currentYear}/${currentMonth}`],
  });

  // Display upload widget if no transactions
  const noTransactions = transactions.length === 0;

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
              
              {/* Upload button */}
              {!noTransactions && (
                <Button 
                  size={isMobile ? "icon" : "default"}
                  onClick={() => setShowUploadWidget(true)}
                  className="ml-2"
                >
                  {isMobile ? <Plus className="h-4 w-4" /> : "Upload Statement"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-gray-100 p-4 sm:p-6 lg:p-8">
        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Upload Widget - shown conditionally */}
          {(showUploadWidget || noTransactions) && (
            <div className={`${isMobile ? "col-span-1" : "lg:col-span-3 md:col-span-2"}`}>
              <UploadWidget 
                onClose={() => setShowUploadWidget(false)}
                showCloseButton={!noTransactions}
              />
            </div>
          )}

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
    </div>
  );
}
