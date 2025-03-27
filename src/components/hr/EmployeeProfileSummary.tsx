import React from '@/lib/react-helpers';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/lib/routes';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, AlertCircle, Mail, PhoneCall, Building, User } from 'lucide-react';
import { format } from 'date-fns';

interface Employee {
  id: string;
  name: string;
  email: string;
  phone?: string;
  department?: string;
  position?: string;
  profile_image_url?: string;
  current_rag_status?: 'green' | 'amber' | 'red';
}

interface EmployeeProfileSummaryProps {
  employee: Employee;
  showContact?: boolean;
  showDepartment?: boolean;
  className?: string;
}

/**
 * A summary version of the employee profile card that can be reused across the application
 */
const EmployeeProfileSummary: React.FC<EmployeeProfileSummaryProps> = ({ 
  employee, 
  showContact = true,
  showDepartment = true,
  className = ''
}) => {
  // Get RAG status colors and icon
  const getRagStatusInfo = (status: string | undefined) => {
    const statusLower = (status || 'green').toLowerCase();
    switch (statusLower) {
      case 'green':
        return { 
          color: 'bg-green-500', 
          textColor: 'text-green-700',
          borderColor: 'border-green-600',
          bgColor: 'bg-green-50',
          icon: <CheckCircle className="h-4 w-4 text-green-500" /> 
        };
      case 'amber':
        return { 
          color: 'bg-amber-500', 
          textColor: 'text-amber-700',
          borderColor: 'border-amber-600',
          bgColor: 'bg-amber-50',
          icon: <AlertTriangle className="h-4 w-4 text-amber-500" /> 
        };
      case 'red':
        return { 
          color: 'bg-red-500', 
          textColor: 'text-red-700',
          borderColor: 'border-red-600',
          bgColor: 'bg-red-50',
          icon: <AlertCircle className="h-4 w-4 text-red-500" /> 
        };
      default:
        return { 
          color: 'bg-gray-500', 
          textColor: 'text-gray-700',
          borderColor: 'border-gray-600',
          bgColor: 'bg-gray-50',
          icon: <CheckCircle className="h-4 w-4 text-gray-500" /> 
        };
    }
  };

  const ragStatus = getRagStatusInfo(employee.current_rag_status);
  
  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-center space-x-4">
          {/* Profile Image */}
          <div className="flex-shrink-0">
            {employee.profile_image_url ? (
              <img 
                src={employee.profile_image_url} 
                alt={employee.name} 
                className="h-12 w-12 rounded-full object-cover"
              />
            ) : (
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-6 w-6 text-primary/40" />
              </div>
            )}
          </div>
          
          {/* Employee Info */}
          <div className="flex-1 min-w-0">
            <Link 
              to={`${ROUTES.HR_DASHBOARD}/employees/${employee.id}`}
              className="text-base font-medium text-gray-900 hover:text-primary transition-colors"
            >
              {employee.name}
            </Link>
            <p className="text-sm text-gray-500 truncate">{employee.position || 'No Position'}</p>
            
            {/* RAG Status Badge */}
            <div className="mt-1">
              <Badge className={`${ragStatus.bgColor} ${ragStatus.textColor} ${ragStatus.borderColor} text-xs`}>
                {ragStatus.icon}
                <span className="ml-1 capitalize">{employee.current_rag_status || 'Green'}</span>
              </Badge>
            </div>
          </div>
        </div>
        
        {/* Contact and Department Info */}
        {(showContact || showDepartment) && (
          <div className="mt-3 space-y-1 text-sm">
            {showContact && (
              <>
                <div className="flex items-center">
                  <Mail className="h-3.5 w-3.5 text-gray-400 mr-2" />
                  <span className="text-gray-600 truncate">{employee.email}</span>
                </div>
                {employee.phone && (
                  <div className="flex items-center">
                    <PhoneCall className="h-3.5 w-3.5 text-gray-400 mr-2" />
                    <span className="text-gray-600">{employee.phone}</span>
                  </div>
                )}
              </>
            )}
            
            {showDepartment && employee.department && (
              <div className="flex items-center">
                <Building className="h-3.5 w-3.5 text-gray-400 mr-2" />
                <span className="text-gray-600">{employee.department}</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EmployeeProfileSummary; 