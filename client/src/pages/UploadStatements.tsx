import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UploadWidget } from "@/components/UploadWidget";
import { useQuery } from "@tanstack/react-query";
import { ArrowDown, Calendar, FileUp } from "lucide-react";
import { format } from "date-fns";
import { useIsMobile } from "@/hooks/use-mobile";

export default function UploadStatements() {
  const isMobile = useIsMobile();

  // Get upload history - this would query the backend in a real app
  const { data: transactions = [] } = useQuery<any[]>({
    queryKey: ['/api/transactions'],
  });

  // Group uploads by month
  const uploadsByMonth: Record<string, { count: number, date: Date }> = {};
  
  if (transactions && transactions.length > 0) {
    transactions.forEach((transaction: any) => {
      if (transaction.pdfSource) {
        const date = new Date(transaction.date);
        const monthYear = format(date, 'MMMM yyyy');
        
        if (!uploadsByMonth[monthYear]) {
          uploadsByMonth[monthYear] = { count: 0, date };
        }
        
        uploadsByMonth[monthYear].count += 1;
      }
    });
  }

  return (
    <div className="flex flex-col h-full">
      {/* Top Navbar */}
      <div className="bg-white shadow-sm z-10">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center">
            <h1 className="text-lg font-semibold">Upload Statements</h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-gray-100 p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Upload Widget - full width on all screens */}
          <div className="col-span-1 md:col-span-2 lg:col-span-3">
            <UploadWidget showCloseButton={false} />
          </div>
          
          {/* Upload History */}
          <div className={isMobile ? "col-span-1" : "col-span-1 md:col-span-1 lg:col-span-2"}>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-medium">Upload History</CardTitle>
              </CardHeader>
              <CardContent>
                {Object.keys(uploadsByMonth).length > 0 ? (
                  <div className="space-y-4">
                    {Object.entries(uploadsByMonth)
                      .sort((a, b) => b[1].date.getTime() - a[1].date.getTime())
                      .map(([monthYear, data]) => (
                        <div key={monthYear} className="flex items-center justify-between border-b pb-3">
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <FileUp className="h-5 w-5 text-blue-600" />
                            </div>
                            <div className="ml-4">
                              <p className="text-sm font-medium text-gray-900">{monthYear} Statement</p>
                              <p className="text-xs text-gray-500">
                                <Calendar className="inline h-3 w-3 mr-1" />
                                {isMobile ? format(data.date, 'MM/dd/yyyy') : format(data.date, 'PPP')}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center text-sm">
                            <span className="text-gray-500 mr-2">{data.count} transactions</span>
                            <ArrowDown className="h-4 w-4 text-gray-400 rotate-90" />
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    <FileUp className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                    <p>No statements have been uploaded yet.</p>
                    <p className="text-sm">Upload your first statement using the form above.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Upload Tips */}
          <div className="col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-medium">Upload Tips</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm text-gray-600">
                  <li className="flex items-start">
                    <span className="h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-2 mt-0.5">1</span>
                    <span>Download your statement from your bank as a PDF file.</span>
                  </li>
                  <li className="flex items-start">
                    <span className="h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-2 mt-0.5">2</span>
                    <span>Make sure the PDF contains transaction details including dates, descriptions, and amounts.</span>
                  </li>
                  <li className="flex items-start">
                    <span className="h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-2 mt-0.5">3</span>
                    <span>Upload one statement at a time for best results.</span>
                  </li>
                  <li className="flex items-start">
                    <span className="h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-2 mt-0.5">4</span>
                    <span>After processing, review the extracted transactions for any needed adjustments.</span>
                  </li>
                  <li className="flex items-start">
                    <span className="h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-2 mt-0.5">5</span>
                    <span>For best results, prefer statements that are not scanned images, as text recognition is more reliable on native PDFs.</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
