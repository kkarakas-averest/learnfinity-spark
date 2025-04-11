
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AICourseContent, AICourseContentSection } from "@/lib/types/content";
import { Sparkles } from "lucide-react";

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
        </CardHeader>
        <CardContent>
          <p className="text-sm text-blue-700">
            This course content has been personalized specifically for your role
            {userProfile.role ? ` as a ${userProfile.role}` : ''}
            {userProfile.department ? ` in the ${userProfile.department} department` : ''}.
          </p>
        </CardContent>
      </Card>

      {/* Content sections */}
      {sections.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Personalized content is being prepared. Please check back soon.
            </p>
          </CardContent>
        </Card>
      ) : (
        sections.map((section) => (
          <Card key={section.id}>
            <CardHeader>
              <CardTitle>{section.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div 
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: section.content }} 
              />
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
