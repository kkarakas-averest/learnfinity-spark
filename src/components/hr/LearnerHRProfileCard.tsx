import React from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Calendar, Building, PhoneCall, Mail, User } from 'lucide-react';
import RAGStatusBadge from './RAGStatusBadge';

interface HREmployeeProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status?: string;
  profile_image_url?: string;
  hire_date?: string;
  rag_status?: string;
  skills?: string[];
  department?: {
    id: string;
    name: string;
  }[];
  position?: {
    id: string;
    title: string;
  }[];
  manager?: {
    id: string;
    name: string;
    email: string;
  }[];
}

interface LearnerHRProfileCardProps {
  hrProfile: HREmployeeProfile | null;
  className?: string;
}

const LearnerHRProfileCard: React.FC<LearnerHRProfileCardProps> = ({ 
  hrProfile, 
  className 
}: LearnerHRProfileCardProps) => {
  if (!hrProfile) {
    return null;
  }

  const departmentName = hrProfile.department && hrProfile.department[0]?.name;
  const positionTitle = hrProfile.position && hrProfile.position[0]?.title;
  const managerName = hrProfile.manager && hrProfile.manager[0]?.name;
  const managerEmail = hrProfile.manager && hrProfile.manager[0]?.email;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">HR Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex flex-col items-center">
            <Avatar className="h-24 w-24 mb-2">
              <AvatarImage src={hrProfile.profile_image_url || ''} alt={hrProfile.name} />
              <AvatarFallback className="text-lg">{getInitials(hrProfile.name)}</AvatarFallback>
            </Avatar>
            {hrProfile.rag_status && (
              <RAGStatusBadge status={hrProfile.rag_status.toLowerCase() as 'red' | 'amber' | 'green'} />
            )}
          </div>
          
          <div className="flex-1 space-y-3">
            <div>
              <h3 className="text-xl font-medium">{hrProfile.name}</h3>
              <div className="flex items-center text-muted-foreground text-sm">
                {positionTitle && (
                  <span className="flex items-center">
                    <Building className="h-3.5 w-3.5 mr-1" />
                    {positionTitle}
                  </span>
                )}
                {departmentName && (
                  <span className="ml-3">
                    {departmentName}
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <div className="flex items-center text-muted-foreground">
                <Mail className="h-3.5 w-3.5 mr-2" />
                {hrProfile.email}
              </div>
              
              {hrProfile.phone && (
                <div className="flex items-center text-muted-foreground">
                  <PhoneCall className="h-3.5 w-3.5 mr-2" />
                  {hrProfile.phone}
                </div>
              )}
              
              {hrProfile.hire_date && (
                <div className="flex items-center text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5 mr-2" />
                  Hired: {format(new Date(hrProfile.hire_date), 'MMM d, yyyy')}
                </div>
              )}
              
              {managerName && (
                <div className="flex items-center text-muted-foreground">
                  <User className="h-3.5 w-3.5 mr-2" />
                  Manager: {managerName}
                </div>
              )}
            </div>

            {hrProfile.skills && hrProfile.skills.length > 0 && (
              <div className="mt-2">
                <h4 className="text-sm font-medium mb-1">Skills</h4>
                <div className="flex flex-wrap gap-1">
                  {hrProfile.skills.map((skill: string, i: number) => (
                    <Badge key={i} variant="outline">{skill}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LearnerHRProfileCard;
