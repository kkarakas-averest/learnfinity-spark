import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import HRDashboardHeader from '@/components/hr/HRDashboardHeader';
import EmployeeDataDashboard from '@/components/hr/EmployeeDataDashboard';
import CourseCreationWizard from '@/components/hr/CourseCreationWizard';
import AssessmentBuilder from '@/components/hr/AssessmentBuilder';

export default function HRDashboard() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <HRDashboardHeader />
      
      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="dashboard">Analytics</TabsTrigger>
          <TabsTrigger value="courses">Course Creation</TabsTrigger>
          <TabsTrigger value="assessments">Assessment Builder</TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard">
          <EmployeeDataDashboard />
        </TabsContent>
        
        <TabsContent value="courses">
          <CourseCreationWizard />
        </TabsContent>
        
        <TabsContent value="assessments">
          <AssessmentBuilder />
        </TabsContent>
      </Tabs>
    </div>
  );
} 