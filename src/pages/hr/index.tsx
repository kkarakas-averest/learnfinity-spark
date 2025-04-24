import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import HRDashboardHeader from '@/components/hr/HRDashboardHeader';
import EmployeeDataDashboard from '@/components/hr/EmployeeDataDashboard';
import CourseCreationWizard from '@/components/hr/CourseCreationWizard';
import AssessmentBuilder from '@/components/hr/AssessmentBuilder';
import { NavigationMenuLink } from '@/components/ui/navigation-menu';
import Link from 'next/link';

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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <NavigationMenuLink asChild>
          <Link
            href="/hr/skills-inventory"
            className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
          >
            <div className="text-sm font-medium leading-none">Skills Matrix & Analytics</div>
            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
              View and analyze employee skills coverage and gaps
            </p>
          </Link>
        </NavigationMenuLink>

        <NavigationMenuLink asChild>
          <Link
            href="/hr/course-generator"
            className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
          >
            <div className="text-sm font-medium leading-none">AI Course Designer</div>
            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
              Create customized courses using AI conversation
            </p>
          </Link>
        </NavigationMenuLink>
      </div>
    </div>
  );
} 