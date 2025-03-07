import React from '@/lib/react-helpers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, AlertCircle, Users } from 'lucide-react';
import { RAGStatus } from '@/types/hr.types';

interface DepartmentRAGData {
  departmentId: string;
  departmentName: string;
  employeeCount: number;
  ragCounts: {
    green: number;
    amber: number;
    red: number;
  };
}

interface DepartmentRAGSummaryProps {
  departments: DepartmentRAGData[];
  onDepartmentClick?: (departmentId: string) => void;
  title?: string;
  description?: string;
  compact?: boolean;
}

/**
 * DepartmentRAGSummary Component
 * 
 * Displays a summary of RAG statuses across different departments
 * with distribution visualization.
 */
const DepartmentRAGSummary: React.FC<DepartmentRAGSummaryProps> = ({
  departments,
  onDepartmentClick,
  title = "Department RAG Status",
  description = "Status distribution across departments",
  compact = false,
}) => {
  // If no departments, show empty state
  if (!departments || departments.length === 0) {
    return (
      <Card className={compact ? 'p-2' : ''}>
        <CardHeader className={compact ? 'p-2' : ''}>
          <CardTitle className={compact ? 'text-base' : ''}>{title}</CardTitle>
          {!compact && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent className={compact ? 'p-2' : ''}>
          <p className="text-sm text-muted-foreground">No department data available</p>
        </CardContent>
      </Card>
    );
  }
  
  // Calculate percentages for a department
  const calculatePercentages = (ragCounts: { green: number; amber: number; red: number; }, total: number) => {
    return {
      green: (ragCounts.green / total) * 100,
      amber: (ragCounts.amber / total) * 100,
      red: (ragCounts.red / total) * 100,
    };
  };

  // Determine the predominant status for a department
  const getPredominantStatus = (ragCounts: { green: number; amber: number; red: number; }): RAGStatus => {
    if (ragCounts.red > ragCounts.green && ragCounts.red > ragCounts.amber) return 'red';
    if (ragCounts.amber > ragCounts.green) return 'amber';
    return 'green';
  };
  
  // Get icon for RAG status
  const getStatusIcon = (status: RAGStatus, className = "h-4 w-4"): JSX.Element => {
    switch (status) {
      case 'red': return <AlertCircle className={className} />;
      case 'amber': return <AlertTriangle className={className} />;
      case 'green': return <CheckCircle className={className} />;
    }
  };
  
  // Get color class for RAG status
  const getStatusColorClass = (status: RAGStatus): string => {
    switch (status) {
      case 'red': return 'text-destructive';
      case 'amber': return 'text-yellow-500';
      case 'green': return 'text-green-500';
    }
  };
  
  // Calculate totals across all departments
  const totalEmployees = departments.reduce((acc, dept) => acc + dept.employeeCount, 0);
  const totalRagCounts = departments.reduce(
    (acc, dept) => ({
      green: acc.green + dept.ragCounts.green,
      amber: acc.amber + dept.ragCounts.amber,
      red: acc.red + dept.ragCounts.red,
    }),
    { green: 0, amber: 0, red: 0 }
  );
  
  const totalPercentages = calculatePercentages(totalRagCounts, totalEmployees);
  
  return (
    <Card className={compact ? 'p-2' : ''}>
      <CardHeader className={compact ? 'p-2' : ''}>
        <CardTitle className={compact ? 'text-base' : ''}>{title}</CardTitle>
        {!compact && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className={compact ? 'px-2 pb-2' : ''}>
        {/* Overall summary */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-medium">Overall Distribution</h3>
            <div className="text-sm text-muted-foreground">{totalEmployees} employees</div>
          </div>
          
          <div className="h-2 w-full flex rounded-full overflow-hidden">
            <div 
              className="bg-green-500" 
              style={{ width: `${totalPercentages.green}%` }}
            />
            <div 
              className="bg-yellow-500" 
              style={{ width: `${totalPercentages.amber}%` }}
            />
            <div 
              className="bg-destructive" 
              style={{ width: `${totalPercentages.red}%` }}
            />
          </div>
          
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <div className="flex items-center">
              <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-1"></span>
              Green: {Math.round(totalPercentages.green)}% ({totalRagCounts.green})
            </div>
            <div className="flex items-center">
              <span className="inline-block w-2 h-2 bg-yellow-500 rounded-full mr-1"></span>
              Amber: {Math.round(totalPercentages.amber)}% ({totalRagCounts.amber})
            </div>
            <div className="flex items-center">
              <span className="inline-block w-2 h-2 bg-destructive rounded-full mr-1"></span>
              Red: {Math.round(totalPercentages.red)}% ({totalRagCounts.red})
            </div>
          </div>
        </div>
        
        {/* Department list */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium mb-2">Department Breakdown</h3>
          
          {departments.map((dept) => {
            const percentages = calculatePercentages(dept.ragCounts, dept.employeeCount);
            const predominantStatus = getPredominantStatus(dept.ragCounts);
            
            return (
              <div 
                key={dept.departmentId} 
                className={`p-3 rounded-md border ${onDepartmentClick ? 'cursor-pointer hover:bg-gray-50' : ''}`}
                onClick={onDepartmentClick ? () => onDepartmentClick(dept.departmentId) : undefined}
              >
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center">
                    <Users className="h-4 w-4 text-primary mr-2" />
                    <h4 className="font-medium">{dept.departmentName}</h4>
                  </div>
                  <div className="flex items-center">
                    <span className="text-xs text-muted-foreground mr-2">{dept.employeeCount} employees</span>
                    <div className={getStatusColorClass(predominantStatus)}>
                      {getStatusIcon(predominantStatus)}
                    </div>
                  </div>
                </div>
                
                <div className="h-1.5 w-full flex rounded-full overflow-hidden mb-2">
                  <div 
                    className="bg-green-500" 
                    style={{ width: `${percentages.green}%` }}
                  />
                  <div 
                    className="bg-yellow-500" 
                    style={{ width: `${percentages.amber}%` }}
                  />
                  <div 
                    className="bg-destructive" 
                    style={{ width: `${percentages.red}%` }}
                  />
                </div>
                
                <div className="flex text-xs text-muted-foreground">
                  <div className="mr-3">{dept.ragCounts.green} Green</div>
                  <div className="mr-3">{dept.ragCounts.amber} Amber</div>
                  <div>{dept.ragCounts.red} Red</div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default DepartmentRAGSummary; 