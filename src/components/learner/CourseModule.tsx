import React, { useState, useEffect } from '@/lib/react-helpers';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  BookOpen, Clock, Video, FileText, CheckCircle, 
  ArrowUpRight, Download, Bookmark, MessageSquare
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

// Types
interface Resource {
  id: string;
  title: string;
  type: 'pdf' | 'link' | 'video' | 'file';
  url: string;
}

export interface CourseModuleData {
  id: string;
  title: string;
  description: string;
  duration: string;
  contentType: 'text' | 'video' | 'quiz' | 'interactive';
  content: string;
  resources?: Resource[];
  completed: boolean;
  progress?: number;
}

interface CourseModuleProps {
  module: CourseModuleData;
  onComplete: (moduleId: string) => void;
  onBookmark: (moduleId: string, position: number) => void;
  onFeedbackRequest: (moduleId: string) => void;
  bookmarkPosition?: number;
  isLastModule?: boolean;
}

/**
 * CourseModule component
 * 
 * Displays a single course module with its content and resources
 */
const CourseModule: React.FC<CourseModuleProps> = ({
  module,
  onComplete,
  onBookmark,
  onFeedbackRequest,
  bookmarkPosition,
  isLastModule = false
}) => {
  const { toast } = useToast();
  const [currentTab, setCurrentTab] = useState('content');
  const [contentRef, setContentRef] = useState<HTMLDivElement | null>(null);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [showFeedbackPrompt, setShowFeedbackPrompt] = useState(false);
  
  // Effect to handle bookmark restoration
  useEffect(() => {
    if (contentRef && bookmarkPosition && bookmarkPosition > 0) {
      // Restore scroll position from bookmark
      contentRef.scrollTop = bookmarkPosition;
      
      toast({
        title: 'Bookmark restored',
        description: 'Resumed from your last position',
      });
    }
  }, [contentRef, bookmarkPosition, toast]);
  
  // Effect to track content scrolling
  useEffect(() => {
    if (!contentRef) return;
    
    const handleScroll = () => {
      if (!hasScrolled && contentRef.scrollTop > 100) {
        setHasScrolled(true);
      }
    };
    
    contentRef.addEventListener('scroll', handleScroll);
    return () => contentRef.removeEventListener('scroll', handleScroll);
  }, [contentRef, hasScrolled]);
  
  // Effect to prompt for feedback when module is completed
  useEffect(() => {
    if (module.completed && !showFeedbackPrompt && isLastModule) {
      // Only show feedback prompt after the last module is completed
      setShowFeedbackPrompt(true);
    }
  }, [module.completed, showFeedbackPrompt, isLastModule]);
  
  // Handle module completion
  const handleComplete = () => {
    onComplete(module.id);
  };
  
  // Handle bookmarking current position
  const handleBookmark = () => {
    if (!contentRef) return;
    
    const position = contentRef.scrollTop;
    onBookmark(module.id, position);
    
    toast({
      title: 'Position bookmarked',
      description: 'Your progress in this module has been saved',
    });
  };
  
  // Handle feedback request
  const handleFeedbackRequest = () => {
    onFeedbackRequest(module.id);
    setShowFeedbackPrompt(false);
  };
  
  // Render content based on type
  const renderContent = () => {
    switch (module.contentType) {
      case 'text':
        return (
          <div className="prose prose-slate max-w-none dark:prose-invert">
            {/* 
              For a proper implementation, use ReactMarkdown:
              
              1. Install dependency: npm install react-markdown
              2. Import: import ReactMarkdown from 'react-markdown'
              3. Replace this with: <ReactMarkdown>{module.content}</ReactMarkdown> 
            */}
            <div dangerouslySetInnerHTML={{ 
              __html: module.content
                .replace(/\n/g, '<br>')
                .replace(/#{1,6}\s+(.*)/g, '<h3>$1</h3>')
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            }} />
          </div>
        );
      case 'video':
        return (
          <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
            <p className="text-center text-gray-500">
              <Video className="w-12 h-12 mx-auto mb-2" />
              Video content would be embedded here.<br />
              URL: {module.content}
            </p>
          </div>
        );
      case 'quiz':
        return (
          <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Module Quiz</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">The quiz interface would be implemented here.</p>
            <Button>Start Quiz</Button>
          </div>
        );
      case 'interactive':
        return (
          <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Interactive Exercise</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">Interactive learning component would be displayed here.</p>
            <Button>Launch Interactive Exercise</Button>
          </div>
        );
      default:
        return <p>Content unavailable</p>;
    }
  };
  
  // Render resource icon based on type
  const getResourceIcon = (type: Resource['type']) => {
    switch (type) {
      case 'pdf':
        return <FileText className="w-4 h-4" />;
      case 'video':
        return <Video className="w-4 h-4" />;
      case 'link':
        return <ArrowUpRight className="w-4 h-4" />;
      case 'file':
        return <Download className="w-4 h-4" />;
    }
  };
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle className="text-xl mb-1">{module.title}</CardTitle>
          <p className="text-sm text-muted-foreground">{module.description}</p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleBookmark}
          className="ml-4 flex-shrink-0"
        >
          <Bookmark className="w-4 h-4 mr-2" />
          Bookmark
        </Button>
      </CardHeader>
      
      <div className="px-6">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center text-sm text-muted-foreground">
            <Clock className="w-4 h-4 mr-1" />
            {module.duration}
          </div>
          {module.progress !== undefined && (
            <div className="text-sm text-muted-foreground">
              {module.progress}% complete
            </div>
          )}
        </div>
        
        {module.progress !== undefined && (
          <Progress value={module.progress} className="h-1 mb-4" />
        )}
      </div>
      
      <Separator />
      
      <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-0 rounded-none border-b">
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
        </TabsList>
        
        <TabsContent value="content" className="m-0">
          <CardContent 
            className="p-6 max-h-[600px] overflow-y-auto" 
            ref={setContentRef}
          >
            {renderContent()}
          </CardContent>
        </TabsContent>
        
        <TabsContent value="resources" className="m-0">
          <CardContent className="p-6">
            {module.resources && module.resources.length > 0 ? (
              <div className="space-y-3">
                {module.resources.map(resource => (
                  <a 
                    key={resource.id}
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                  >
                    <div className="bg-primary/10 p-2 rounded mr-3">
                      {getResourceIcon(resource.type)}
                    </div>
                    <div>
                      <div className="font-medium">{resource.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {resource.type.toUpperCase()}
                      </div>
                    </div>
                    <ArrowUpRight className="w-4 h-4 ml-auto text-muted-foreground" />
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-6">
                No resources available for this module.
              </p>
            )}
          </CardContent>
        </TabsContent>
      </Tabs>
      
      <CardFooter className="flex justify-between py-4 border-t">
        {module.completed ? (
          <>
            <div className="flex items-center text-green-500">
              <CheckCircle className="w-4 h-4 mr-2" />
              Module Completed
            </div>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleFeedbackRequest}
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Provide Feedback
            </Button>
          </>
        ) : (
          <Button 
            onClick={handleComplete} 
            className="ml-auto"
          >
            Mark as Complete
            <CheckCircle className="w-4 h-4 ml-2" />
          </Button>
        )}
      </CardFooter>
      
      {showFeedbackPrompt && (
        <div className="border-t p-4 bg-muted/50">
          <div className="flex items-start">
            <div className="flex-1">
              <h4 className="font-medium mb-1">Module Complete!</h4>
              <p className="text-sm text-muted-foreground">Would you like to provide feedback to help us improve this module?</p>
            </div>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowFeedbackPrompt(false)}
              >
                Not Now
              </Button>
              <Button 
                size="sm" 
                onClick={handleFeedbackRequest}
              >
                Provide Feedback
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default CourseModule; 