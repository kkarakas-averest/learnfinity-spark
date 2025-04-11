
import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AICourseContent, AICourseContentSection } from "@/lib/types/content";
import { Sparkles, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface PersonalizedContentViewProps {
  content: AICourseContent | null;
  sections: AICourseContentSection[];
  isLoading: boolean;
}

export function PersonalizedContentView({ 
  content, 
  sections, 
  isLoading 
}: PersonalizedContentViewProps) {
  // Show loading state while content is being fetched
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  // Handle case when no content is available
  if (!content) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <p className="text-muted-foreground">
            No personalized content is available for this course yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Handle case when content exists but no sections
  if (sections.length === 0) {
    return (
      <div className="space-y-6">
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-blue-700">
              <Sparkles className="h-5 w-5 mr-2" />
              Personalized Learning Experience
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-blue-700">
              Content is being personalized for you. The system has created a personalization record but the content sections are still being generated.
            </p>
          </CardContent>
        </Card>
        
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Content Generation in Progress</AlertTitle>
          <AlertDescription>
            Your personalized content is being created. Please check back in a few moments.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Extract context information if available
  const context = content.personalization_context || {};
  const userProfile = context.userProfile || {};
  const employeeContext = context.employeeContext || {};
  const courseContext = context.courseContext || {};
  
  return (
    <div className="space-y-6">
      {/* Personalization context summary */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center text-blue-700">
            <Sparkles className="h-5 w-5 mr-2" />
            Personalized Learning Experience
          </CardTitle>
          {courseContext?.title && (
            <CardDescription className="text-blue-600">
              Course: {courseContext.title}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <p className="text-sm text-blue-700">
            This content has been personalized specifically for your role
            {userProfile.role ? ` as a ${userProfile.role}` : ''}
            {userProfile.department ? ` in the ${userProfile.department} department` : ''}.
            {employeeContext?.hire_date ? ` You joined on ${new Date(employeeContext.hire_date).toLocaleDateString()}.` : ''}
          </p>
        </CardContent>
      </Card>

      {/* Debug information in development mode */}
      {import.meta.env.DEV && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-amber-800 text-sm">Debug Information</CardTitle>
          </CardHeader>
          <CardContent className="text-xs font-mono text-amber-800">
            <div className="overflow-auto max-h-40">
              <p>Content ID: {content.id}</p>
              <p>Created for user: {content.created_for_user_id}</p>
              <p>Is active: {content.is_active ? 'Yes' : 'No'}</p>
              <p>Sections: {sections.length}</p>
              <p>Created at: {new Date(content.created_at).toLocaleString()}</p>
              <p>Updated at: {new Date(content.updated_at).toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Content sections */}
      <div className="space-y-6">
        {sections.map((section) => (
          <Card key={section.id} className="overflow-hidden">
            <CardHeader className="bg-gray-50">
              <CardTitle className="text-lg">{section.title}</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div 
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: section.content }} 
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
