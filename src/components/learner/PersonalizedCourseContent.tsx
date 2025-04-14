
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen, FileText } from 'lucide-react';
import { AICourseContent, AICourseContentSection } from '@/lib/types/content';

interface PersonalizedCourseContentProps {
  content: AICourseContent | null;
  sections: AICourseContentSection[];
  isLoading: boolean;
}

const PersonalizedCourseContent: React.FC<PersonalizedCourseContentProps> = ({
  content,
  sections,
  isLoading
}) => {
  const [activeTab, setActiveTab] = useState<string>('modules');
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (!content) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-medium mb-2">No Personalized Content</h3>
            <p className="text-muted-foreground">
              No personalized content is available for this course.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Group sections by module_id
  const moduleMap = sections.reduce<Record<string, AICourseContentSection[]>>(
    (acc, section) => {
      if (!acc[section.module_id]) {
        acc[section.module_id] = [];
      }
      acc[section.module_id].push(section);
      return acc;
    },
    {}
  );

  const modules = Object.keys(moduleMap);

  if (modules.length > 0 && !selectedModuleId) {
    setSelectedModuleId(modules[0]);
  }

  const renderModuleContent = () => {
    if (!selectedModuleId) {
      return (
        <div className="p-4 text-center">
          <p className="text-muted-foreground">Select a module to view its content</p>
        </div>
      );
    }
    
    const moduleSections = moduleMap[selectedModuleId]?.sort((a, b) => a.order_index - b.order_index) || [];
    
    if (moduleSections.length === 0) {
      return (
        <div className="p-4 text-center">
          <p className="text-muted-foreground">No content available for this module</p>
        </div>
      );
    }
    
    return (
      <div className="space-y-6">
        {moduleSections.map(section => (
          <Card key={section.id} className="overflow-hidden">
            <CardHeader className="bg-muted/30">
              <CardTitle className="text-lg">{section.title}</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div 
                className="prose max-w-none dark:prose-invert" 
                dangerouslySetInnerHTML={{ __html: section.content }}
              />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">{content.title}</h2>
        <p className="text-muted-foreground">{content.description}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Module Navigation */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Modules</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <nav className="divide-y">
                {modules.map((moduleId) => {
                  const moduleFirstSection = moduleMap[moduleId][0];
                  const moduleTitle = moduleFirstSection?.title.split(':')[0] || 'Module';
                  
                  return (
                    <button
                      key={moduleId}
                      onClick={() => setSelectedModuleId(moduleId)}
                      className={`w-full text-left px-4 py-3 flex items-center hover:bg-muted/50 transition-colors ${
                        moduleId === selectedModuleId ? 'bg-muted/50 font-medium' : ''
                      }`}
                    >
                      <FileText className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span className="truncate">{moduleTitle}</span>
                    </button>
                  );
                })}
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Content Area */}
        <div className="md:col-span-3">
          <Card>
            <CardContent className="p-6">
              {renderModuleContent()}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PersonalizedCourseContent;
