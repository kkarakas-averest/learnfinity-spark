
import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AICourseContent, AICourseContentSection } from '@/lib/types/content';
import PersonalizedCourseContent from '../learner/PersonalizedCourseContent';

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
  return (
    <div>
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      ) : content ? (
        <PersonalizedCourseContent 
          content={content}
          sections={sections}
          isLoading={isLoading}
        />
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No personalized content</h3>
            <p className="text-muted-foreground mb-6">
              This course doesn't have any personalized content generated for you yet.
            </p>
            <Button>Generate Personalized Content</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
