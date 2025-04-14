import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen, Clock, CheckCircle, Video, FileText, ArrowLeft, ArrowRight, MessageSquare } from 'lucide-react';
import CourseContentSection from './CourseContentSection';
import { AICourseContent, AICourseContentSection } from '@/lib/types/content';
import { useToast } from '@/components/ui/use-toast';

interface PersonalizedCourseContentProps {
  content: AICourseContent | null;
  sections: AICourseContentSection[];
  isLoading: boolean;
  onBack?: () => void;
}

interface Module {
  id: string;
  title: string;
  sections: AICourseContentSection[];
}

const PersonalizedCourseContent: React.FC<PersonalizedCourseContentProps> = ({
  content,
  sections,
  isLoading,
  onBack
}) => {
  const { toast } = useToast();
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [completedSections, setCompletedSections] = useState<string[]>([]);
  const [modules, setModules] = useState<Module[]>([]);

  useEffect(() => {
    if (!isLoading && sections.length > 0) {
      // Group sections by module
      const modulesMap = new Map<string, Module>();
      
      sections.forEach(section => {
        if (!modulesMap.has(section.module_id)) {
          modulesMap.set(section.module_id, {
            id: section.module_id,
            title: formatModuleTitle(section.module_id),
            sections: []
          });
        }
        
        modulesMap.get(section.module_id)?.sections.push(section);
      });
      
      // Sort modules by their first section's order_index
      const sortedModules = Array.from(modulesMap.values()).sort((a, b) => {
        const aIndex = a.sections[0]?.order_index || 0;
        const bIndex = b.sections[0]?.order_index || 0;
        return aIndex - bIndex;
      });
      
      // Sort sections within each module
      sortedModules.forEach(module => {
        module.sections.sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
      });
      
      setModules(sortedModules);
      
      // Set first module and section as active by default
      if (sortedModules.length > 0) {
        setActiveModuleId(sortedModules[0].id);
        if (sortedModules[0].sections.length > 0) {
          setActiveSectionId(sortedModules[0].sections[0].id);
        }
      }
    }
  }, [isLoading, sections]);

  const formatModuleTitle = (moduleId: string): string => {
    // Extract a human-readable title from the module ID
    return moduleId
      .replace(/module-(\d+)/i, 'Module $1')
      .replace(/-/g, ' ')
      .replace(/personalized.*$/, '')
      .trim();
  };

  const markSectionComplete = (sectionId: string) => {
    // Mark the section as completed
    if (!completedSections.includes(sectionId)) {
      const newCompletedSections = [...completedSections, sectionId];
      setCompletedSections(newCompletedSections);
      
      // Update progress percentage
      const totalSections = sections.length;
      const completedCount = newCompletedSections.length;
      const newProgress = Math.round((completedCount / totalSections) * 100);
      setProgress(newProgress);
      
      toast({
        title: "Progress saved",
        description: "Your progress has been updated",
      });
    }
  };

  const handleSectionClick = (moduleId: string, sectionId: string) => {
    setActiveModuleId(moduleId);
    setActiveSectionId(sectionId);
  };

  const navigateToNextSection = () => {
    if (!activeModuleId || !activeSectionId) return;
    
    const currentModule = modules.find(m => m.id === activeModuleId);
    if (!currentModule) return;
    
    const currentSectionIndex = currentModule.sections.findIndex(s => s.id === activeSectionId);
    
    // If there's another section in the current module
    if (currentSectionIndex < currentModule.sections.length - 1) {
      setActiveSectionId(currentModule.sections[currentSectionIndex + 1].id);
      return;
    }
    
    // Otherwise, move to the first section of the next module
    const currentModuleIndex = modules.findIndex(m => m.id === activeModuleId);
    if (currentModuleIndex < modules.length - 1) {
      const nextModule = modules[currentModuleIndex + 1];
      setActiveModuleId(nextModule.id);
      setActiveSectionId(nextModule.sections[0]?.id || null);
    }
  };

  const navigateToPreviousSection = () => {
    if (!activeModuleId || !activeSectionId) return;
    
    const currentModule = modules.find(m => m.id === activeModuleId);
    if (!currentModule) return;
    
    const currentSectionIndex = currentModule.sections.findIndex(s => s.id === activeSectionId);
    
    // If there's a previous section in the current module
    if (currentSectionIndex > 0) {
      setActiveSectionId(currentModule.sections[currentSectionIndex - 1].id);
      return;
    }
    
    // Otherwise, move to the last section of the previous module
    const currentModuleIndex = modules.findIndex(m => m.id === activeModuleId);
    if (currentModuleIndex > 0) {
      const prevModule = modules[currentModuleIndex - 1];
      setActiveModuleId(prevModule.id);
      setActiveSectionId(prevModule.sections[prevModule.sections.length - 1]?.id || null);
    }
  };

  const getActiveSection = () => {
    if (!activeModuleId || !activeSectionId) return null;
    
    const currentModule = modules.find(m => m.id === activeModuleId);
    if (!currentModule) return null;
    
    return currentModule.sections.find(s => s.id === activeSectionId) || null;
  };

  const contentTypeIcon = (content: string) => {
    if (content.includes('<iframe') || content.includes('video')) {
      return <Video className="h-4 w-4 mr-1" />;
    }
    return <FileText className="h-4 w-4 mr-1" />;
  };

  const estimatedReadingTime = (content: string): number => {
    // Estimate reading time: average reading speed is about 200 words per minute
    const text = content.replace(/<[^>]+>/g, '');
    const words = text.split(/\s+/).length;
    return Math.max(1, Math.ceil(words / 200));
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-3/4" />
        <div className="flex justify-between">
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-6 w-1/4" />
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (!content) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">No personalized content available</h3>
          <p className="text-muted-foreground mb-6">
            Personalized content for this course hasn't been generated yet.
          </p>
          <Button>Generate Personalized Content</Button>
        </CardContent>
      </Card>
    );
  }

  if (sections.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">No content sections available</h3>
          <p className="text-muted-foreground mb-6">
            This course has been personalized for you, but no content sections are available yet.
          </p>
          <Button>Regenerate Content</Button>
        </CardContent>
      </Card>
    );
  }

  const activeSection = getActiveSection();

  return (
    <div className="space-y-6">
      <div>
        {onBack && (
          <Button variant="ghost" className="pl-0 mb-2" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to course
          </Button>
        )}

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">{content.title}</h2>
            <p className="text-muted-foreground">{content.description}</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div>
              <span className="text-sm font-medium">Your progress</span>
              <div className="flex items-center">
                <Progress value={progress} className="w-40 mr-2" />
                <span className="text-sm font-medium">{progress}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Sidebar with module navigation */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Course Content</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <nav className="space-y-1">
                {modules.map((module) => (
                  <div key={module.id} className="mb-4">
                    <div className="flex items-center font-medium mb-1 text-sm">
                      <BookOpen className="h-4 w-4 mr-1.5" />
                      <span>{module.title}</span>
                    </div>
                    
                    <div className="space-y-1 pl-5 border-l">
                      {module.sections.map((section) => (
                        <button
                          key={section.id}
                          onClick={() => handleSectionClick(module.id, section.id)}
                          className={`w-full text-left px-2 py-1 text-sm rounded-md hover:bg-muted flex justify-between items-center ${
                            section.id === activeSectionId ? 'bg-muted font-medium' : ''
                          }`}
                        >
                          <div className="flex items-center max-w-[80%]">
                            {completedSections.includes(section.id) ? (
                              <CheckCircle className="h-3.5 w-3.5 mr-1.5 text-green-500 flex-shrink-0" />
                            ) : (
                              <div className="h-3.5 w-3.5 mr-1.5 rounded-full border border-current flex-shrink-0" />
                            )}
                            <span className="truncate">{section.title}</span>
                          </div>
                          <span className="text-xs text-muted-foreground flex-shrink-0">
                            {estimatedReadingTime(section.content)} min
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Main content area */}
        <div className="md:col-span-3">
          <Card>
            <CardContent className="p-6">
              <Tabs defaultValue="content" className="space-y-6">
                <div className="flex justify-between items-center">
                  <TabsList>
                    <TabsTrigger value="content">Content</TabsTrigger>
                    <TabsTrigger value="discussion">Discussion</TabsTrigger>
                    <TabsTrigger value="notes">Notes</TabsTrigger>
                  </TabsList>
                  
                  {activeSection && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      {contentTypeIcon(activeSection.content)}
                      <Clock className="h-4 w-4 ml-2 mr-1" />
                      <span>{estimatedReadingTime(activeSection.content)} min read</span>
                    </div>
                  )}
                </div>
                
                <TabsContent value="content" className="space-y-6">
                  {activeSection ? (
                    <div>
                      <h3 className="text-xl font-semibold mb-4">{activeSection.title}</h3>
                      <Separator className="my-4" />
                      
                      <CourseContentSection
                        title=""
                        content={activeSection.content}
                      />
                      
                      <div className="flex justify-between items-center mt-8">
                        <Button 
                          variant="outline" 
                          onClick={navigateToPreviousSection}
                          disabled={
                            activeModuleId === modules[0]?.id && 
                            activeSectionId === modules[0]?.sections[0]?.id
                          }
                        >
                          <ArrowLeft className="mr-2 h-4 w-4" />
                          Previous
                        </Button>
                        
                        <Button 
                          onClick={() => markSectionComplete(activeSection.id)}
                          disabled={completedSections.includes(activeSection.id)}
                        >
                          {completedSections.includes(activeSection.id) 
                            ? 'Completed'
                            : 'Mark as Complete'
                          }
                        </Button>
                        
                        <Button
                          onClick={navigateToNextSection}
                          disabled={
                            activeModuleId === modules[modules.length - 1]?.id &&
                            activeSectionId === modules[modules.length - 1]?.sections[modules[modules.length - 1]?.sections.length - 1]?.id
                          }
                        >
                          Next
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">Select a section</h3>
                      <p className="text-muted-foreground">
                        Choose a section from the course content to start learning
                      </p>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="discussion">
                  <div className="text-center py-12">
                    <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">Discussion coming soon</h3>
                    <p className="text-muted-foreground">
                      This feature will allow you to discuss course content with other learners
                    </p>
                  </div>
                </TabsContent>
                
                <TabsContent value="notes">
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">Notes coming soon</h3>
                    <p className="text-muted-foreground">
                      This feature will allow you to take notes while learning
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PersonalizedCourseContent;
