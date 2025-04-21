import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AICourseContent, AICourseContentSection } from '@/lib/types/content';
import { Skeleton } from '@/components/ui/skeleton';
import { RegenerateContentButton } from '@/components/CourseView/RegenerateContentButton';
import ReactMarkdown from 'react-markdown';

interface PersonalizedCourseContentProps {
  content: AICourseContent | null;
  sections: AICourseContentSection[];
  isLoading?: boolean;
}

const PersonalizedCourseContent: React.FC<PersonalizedCourseContentProps> = ({ 
  content, 
  sections, 
  isLoading = false 
}: PersonalizedCourseContentProps) => {
  console.log(`Rendering PersonalizedCourseContent with: ${content ? `contentId: ${content.id}, sectionsCount: ${sections.length}` : 'null content'}, sections: ${JSON.stringify(sections)}`);
  
  // Group sections by module_id
  const moduleMap = React.useMemo(() => {
    const map = new Map<string, AICourseContentSection[]>();
    
    sections.forEach(section => {
      if (!section.module_id) return;
      
      if (!map.has(section.module_id)) {
        map.set(section.module_id, []);
      }
      
      map.get(section.module_id)!.push(section);
    });
    
    // Sort sections within each module by order_index
    map.forEach((moduleSections) => {
      moduleSections.sort((a, b) => 
        (a.order_index || 0) - (b.order_index || 0)
      );
    });
    
    return map;
  }, [sections]);
  
  // Extract module info for tabs
  const modules = React.useMemo(() => {
    return (Array.from(moduleMap.keys()) as string[]).map((moduleId) => {
      const moduleSections = moduleMap.get(moduleId) || [];
      // Use the first section's title to derive module title
      const firstSection = moduleSections[0];
      let moduleTitle = `Module ${typeof moduleId === 'string' ? moduleId.slice(-1) : ''}`;
      
      if (firstSection && firstSection.title) {
        const titleParts = firstSection.title.split(':');
        if (titleParts.length > 0) {
          moduleTitle = titleParts[0].trim();
        }
      }
      
      return {
        id: moduleId,
        title: moduleTitle,
        sections: moduleSections
      };
    });
  }, [moduleMap]);
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  
  if (!content || sections.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center space-y-2">
            <h3 className="text-lg font-medium">No personalized content available</h3>
            <p className="text-muted-foreground">Try generating personalized content first.</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Personalized Learning: {content.title}</CardTitle>
            <div className="flex items-center gap-2">
              <RegenerateContentButton courseId={content.course_id} />
              <Badge variant="outline">Personalized</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p>{content.description}</p>
          
          {content.learning_objectives && content.learning_objectives.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-medium mb-2">Learning Objectives:</h3>
              <ul className="list-disc list-inside text-sm text-muted-foreground">
                {Array.isArray(content.learning_objectives) ? (
                  content.learning_objectives.map((objective: string, index: number) => (
                    <li key={index} className="ml-2">{objective}</li>
                  ))
                ) : (
                  <li className="ml-2">Understand core concepts with personalized examples</li>
                )}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
      
      {modules.length > 0 ? (
        <Tabs defaultValue={modules[0].id}>
          <TabsList className="mb-4">
            {modules.map((module: { id: string; title: string; sections: AICourseContentSection[] }) => (
              <TabsTrigger key={module.id} value={module.id} className="flex-1">
                {module.title}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {modules.map((module: { id: string; title: string; sections: AICourseContentSection[] }) => (
            <TabsContent key={module.id} value={module.id} className="space-y-4">
              {module.sections.map((section: AICourseContentSection, index: number) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="text-lg">{section.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div 
                      className="prose max-w-none mb-4"
                      dangerouslySetInnerHTML={{ __html: section.content }}
                    />
                    {section.case_study && (
                      <blockquote className="border-l-4 border-blue-400 bg-blue-50 p-4 my-4 text-blue-900">
                        <strong>Case Study:</strong>
                        <div dangerouslySetInnerHTML={{ __html: section.case_study }} />
                      </blockquote>
                    )}
                    {section.actionable_takeaway && (
                      <div className="bg-green-50 border-l-4 border-green-400 p-4 my-4 rounded">
                        <strong>Actionable Takeaway:</strong> {section.actionable_takeaway}
                      </div>
                    )}
                    {section.quiz && section.quiz.question && (
                      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 my-4 rounded">
                        <strong>Quiz:</strong>
                        <div className="mt-2">
                          <span className="font-medium">Q:</span> {section.quiz.question}
                        </div>
                        {section.quiz.answer && (
                          <details className="mt-2 cursor-pointer">
                            <summary className="font-medium text-blue-700">Show Answer</summary>
                            <div className="mt-1">{section.quiz.answer}</div>
                          </details>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          ))}
        </Tabs>
      ) : (
        <Card>
          <CardContent className="p-6">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-medium">Content structure is being prepared</h3>
              <p className="text-muted-foreground">Please check back in a few moments.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PersonalizedCourseContent;
