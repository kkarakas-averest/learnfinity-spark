import React from "@/lib/react-helpers";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Download } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const ReportsPage: React.FC = () => {
  const navigate = useNavigate();

  const goBack = () => {
    navigate("/hr-dashboard");
  };

  // RAG status summary data
  const ragData = {
    green: 68,
    amber: 24,
    red: 8
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button variant="ghost" size="sm" onClick={goBack} className="mr-4">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-2xl font-bold">Reports & Analytics</h1>
        </div>
        <Button>
          <Download className="h-4 w-4 mr-2" />
          Export Reports
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Employees On Track</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div className="mr-2 h-4 w-4 rounded-full bg-green-500"></div>
              <div className="text-2xl font-bold">{ragData.green}%</div>
            </div>
            <div className="mt-4 h-2 w-full bg-gray-200 rounded-full">
              <div className="bg-green-500 h-2 rounded-full" style={{ width: `${ragData.green}%` }}></div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Employees Needing Attention</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div className="mr-2 h-4 w-4 rounded-full bg-amber-500"></div>
              <div className="text-2xl font-bold">{ragData.amber}%</div>
            </div>
            <div className="mt-4 h-2 w-full bg-gray-200 rounded-full">
              <div className="bg-amber-500 h-2 rounded-full" style={{ width: `${ragData.amber}%` }}></div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Employees Requiring Intervention</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div className="mr-2 h-4 w-4 rounded-full bg-red-500"></div>
              <div className="text-2xl font-bold">{ragData.red}%</div>
            </div>
            <div className="mt-4 h-2 w-full bg-gray-200 rounded-full">
              <div className="bg-red-500 h-2 rounded-full" style={{ width: `${ragData.red}%` }}></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Monthly Completion Rates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">January</span>
                <span className="text-sm font-medium">65%</span>
              </div>
              <div className="h-2 w-full bg-gray-200 rounded-full">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '65%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">February</span>
                <span className="text-sm font-medium">72%</span>
              </div>
              <div className="h-2 w-full bg-gray-200 rounded-full">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '72%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">March</span>
                <span className="text-sm font-medium">80%</span>
              </div>
              <div className="h-2 w-full bg-gray-200 rounded-full">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '80%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">April</span>
                <span className="text-sm font-medium">76%</span>
              </div>
              <div className="h-2 w-full bg-gray-200 rounded-full">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '76%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">May</span>
                <span className="text-sm font-medium">85%</span>
              </div>
              <div className="h-2 w-full bg-gray-200 rounded-full">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '85%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">June</span>
                <span className="text-sm font-medium">90%</span>
              </div>
              <div className="h-2 w-full bg-gray-200 rounded-full">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '90%' }}></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Popular Courses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Course Name</th>
                  <th className="text-left py-3 px-4">Enrollments</th>
                  <th className="text-left py-3 px-4">Completion Rate</th>
                  <th className="text-left py-3 px-4">Avg. Rating</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-3 px-4">New Employee Onboarding</td>
                  <td className="py-3 px-4">124</td>
                  <td className="py-3 px-4">92%</td>
                  <td className="py-3 px-4">4.7/5</td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-4">Leadership Fundamentals</td>
                  <td className="py-3 px-4">86</td>
                  <td className="py-3 px-4">78%</td>
                  <td className="py-3 px-4">4.5/5</td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-4">Technical Skills: Web Development</td>
                  <td className="py-3 px-4">62</td>
                  <td className="py-3 px-4">65%</td>
                  <td className="py-3 px-4">4.3/5</td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-4">Project Management Essentials</td>
                  <td className="py-3 px-4">94</td>
                  <td className="py-3 px-4">82%</td>
                  <td className="py-3 px-4">4.6/5</td>
                </tr>
                <tr>
                  <td className="py-3 px-4">Customer Service Excellence</td>
                  <td className="py-3 px-4">78</td>
                  <td className="py-3 px-4">88%</td>
                  <td className="py-3 px-4">4.8/5</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportsPage; 