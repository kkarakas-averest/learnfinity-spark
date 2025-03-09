import React, { useState, useEffect } from '@/lib/react-helpers';
import { useParams, useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  BookOpen, Clock, ArrowLeft, ArrowRight, 
  Bookmark, CheckCircle, BarChart2, FileText, 
  Video, ArrowUpRight, Download, MessageSquare
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { RAGStatusBadge } from '@/components/hr/RAGStatusBadge';
import { RAGStatus } from '@/types/hr.types';

// Types
interface CourseModule {
  id: string;
  title: string;
  description: string;
  duration: string;
  contentType: 'text' | 'video' | 'quiz' | 'interactive';
  content: string;
  resources?: Resource[];
  completed: boolean;
}

interface Resource {
  id: string;
  title: string;
  type: 'pdf' | 'link' | 'video' | 'file';
  url: string;
}

interface CourseData {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: string;
  progress: number;
  enrolledDate: string;
  lastAccessed?: string;
  ragStatus: RAGStatus;
  modules: CourseModule[];
}

/**
 * CourseView component
 * 
 * Displays a complete course with all its modules and tracks user progress
 */
const CourseView: React.FC = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // States
  const [course, setCourse] = useState<CourseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeModule, setActiveModule] = useState<string | null>(null);
  const [bookmarks, setBookmarks] = useState<Record<string, number>>({});
  const [currentTab, setCurrentTab] = useState('content');
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  
  // Effect to fetch course data
  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        setLoading(true);
        
        // In a real implementation, this would be a call to your API
        // For now, use mock data
        const mockCourse: CourseData = {
          id: courseId || 'course-1',
          title: 'Introduction to Machine Learning',
          description: 'Learn the fundamentals of machine learning algorithms and their applications in real-world scenarios.',
          imageUrl: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=1600&h=900',
          level: 'Beginner',
          duration: '8 hours',
          progress: 35,
          enrolledDate: '2023-12-10',
          lastAccessed: '2023-12-15',
          ragStatus: 'green',
          modules: [
            {
              id: 'module-1',
              title: 'Introduction to ML Concepts',
              description: 'Understand the basic concepts and terminology of machine learning.',
              duration: '1 hour',
              contentType: 'text',
              content: `
                # Introduction to Machine Learning
                
                Machine learning is a subset of artificial intelligence that focuses on developing systems that can learn from and make decisions based on data.
                
                ## Key Concepts
                
                - **Supervised Learning**: The algorithm is trained on labeled data.
                - **Unsupervised Learning**: The algorithm finds patterns in unlabeled data.
                - **Reinforcement Learning**: The algorithm learns through trial and error.
                
                ## Applications
                
                Machine learning is used in various fields including:
                - Image and speech recognition
                - Natural language processing
                - Recommendation systems
                - Fraud detection
              `,
              resources: [
                { id: 'res-1', title: 'ML Glossary', type: 'pdf', url: '/resources/ml-glossary.pdf' },
                { id: 'res-2', title: 'Introduction Video', type: 'video', url: 'https://example.com/videos/intro-ml' }
              ],
              completed: true
            },
            {
              id: 'module-2',
              title: 'Supervised Learning',
              description: 'Learn about classification and regression techniques.',
              duration: '2 hours',
              contentType: 'video',
              content: 'https://example.com/videos/supervised-learning',
              resources: [
                { id: 'res-3', title: 'Classification Guide', type: 'pdf', url: '/resources/classification.pdf' },
                { id: 'res-4', title: 'Regression Examples', type: 'link', url: 'https://example.com/regression' }
              ],
              completed: true
            },
            {
              id: 'module-3',
              title: 'Unsupervised Learning',
              description: 'Explore clustering and dimensionality reduction.',
              duration: '2 hours',
              contentType: 'text',
              content: `
                # Unsupervised Learning
                
                Unsupervised learning involves training algorithms to find patterns in data without predefined labels.
                
                ## Clustering
                
                Clustering groups similar data points together. Common algorithms include:
                - K-means
                - Hierarchical clustering
                - DBSCAN
                
                ## Dimensionality Reduction
                
                These techniques reduce the number of variables in data while preserving important information:
                - Principal Component Analysis (PCA)
                - t-SNE
                - Autoencoders
              `,
              resources: [
                { id: 'res-5', title: 'Clustering Tutorial', type: 'pdf', url: '/resources/clustering.pdf' }
              ],
              completed: false
            },
            {
              id: 'module-4',
              title: 'Model Evaluation',
              description: 'Learn how to evaluate and improve machine learning models.',
              duration: '1.5 hours',
              contentType: 'quiz',
              content: 'quiz-data-would-be-here',
              completed: false
            },
            {
              id: 'module-5',
              title: 'Practical Applications',
              description: 'Real-world applications and case studies of machine learning.',
              duration: '1.5 hours',
              contentType: 'interactive',
              content: 'interactive-content-placeholder',
              completed: false
            }
          ]
        };
        
        // Simulate network delay
        setTimeout(() => {
          setCourse(mockCourse);
          
          // Set active module (either first incomplete or first module)
          const incompleteModule = mockCourse.modules.find(module => !module.completed);
          setActiveModule(incompleteModule ? incompleteModule.id : mockCourse.modules[0].id);
          
          // Load bookmarks from localStorage if any
          const savedBookmarks = localStorage.getItem(`bookmarks-${courseId}`);
          if (savedBookmarks) {
            setBookmarks(JSON.parse(savedBookmarks));
          }
          
          setLoading(false);
        }, 1000);
        
      } catch (error) {
        console.error('Error fetching course data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load course content. Please try again later.',
          variant: 'destructive'
        });
        setLoading(false);
      }
    };
    
    fetchCourseData();
  }, [courseId, toast]);
  
  // Handle module change
  const handleModuleChange = (moduleId: string) => {
    setActiveModule(moduleId);
    
    // In a real app, you would also update the user's progress on the server
    if (course) {
      const updatedCourse = { ...course };
      // Mark current module as viewed/completed if needed
      setCourse(updatedCourse);
    }
  };
  
  // Handle bookmarking
  const handleBookmark = () => {
    if (!activeModule || !course) return;
    
    // Get content element to determine scroll position
    const contentElement = document.getElementById('module-content');
    if (!contentElement) return;
    
    const scrollPosition = contentElement.scrollTop;
    
    // Update bookmarks state
    const updatedBookmarks = {
      ...bookmarks,
      [activeModule]: scrollPosition
    };
    
    setBookmarks(updatedBookmarks);
    
    // Save to localStorage
    localStorage.setItem(`bookmarks-${courseId}`, JSON.stringify(updatedBookmarks));
    
    toast({
      title: 'Bookmark added',
      description: 'Your place in this module has been saved.',
    });
  };
  
  // Handle module completion
  const handleCompleteModule = () => {
    if (!activeModule || !course) return;
    
    const updatedCourse = { ...course };
    const moduleIndex = updatedCourse.modules.findIndex(m => m.id === activeModule);
    
    if (moduleIndex !== -1) {
      updatedCourse.modules[moduleIndex].completed = true;
      
      // Update progress percentage
      const completedCount = updatedCourse.modules.filter(m => m.completed).length;
      updatedCourse.progress = Math.round((completedCount / updatedCourse.modules.length) * 100);
      
      // Update course data
      setCourse(updatedCourse);
      
      // In a real app, send this update to the server
      
      toast({
        title: 'Module completed',
        description: 'Your progress has been updated.',
      });
      
      // Check if next module exists and navigate to it
      if (moduleIndex < updatedCourse.modules.length - 1) {
        setActiveModule(updatedCourse.modules[moduleIndex + 1].id);
      }
    }
  };
  
  // Navigate to next/previous module
  const navigateModule = (direction: 'prev' | 'next') => {
    if (!course || !activeModule) return;
    
    const currentIndex = course.modules.findIndex(m => m.id === activeModule);
    if (currentIndex === -1) return;
    
    if (direction === 'prev' && currentIndex > 0) {
      setActiveModule(course.modules[currentIndex - 1].id);
    } else if (direction === 'next' && currentIndex < course.modules.length - 1) {
      setActiveModule(course.modules[currentIndex + 1].id);
    }
  };
  
  // Render content based on type
  const renderModuleContent = (module: CourseModule) => {
    switch (module.contentType) {
      case 'text':
        return (
          <div className="prose prose-slate max-w-none">
            {/* In a real app, you'd use a markdown renderer here */}
            <div dangerouslySetInnerHTML={{ __html: module.content.replace(/\n/g, '<br>').replace(/#{1,6}\s+(.*)/g, '<h3>$1</h3>') }} />
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
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Module Quiz</h3>
            <p className="text-gray-500 mb-4">The quiz interface would be implemented here.</p>
            <Button>Start Quiz</Button>
          </div>
        );
      case 'interactive':
        return (
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Interactive Exercise</h3>
            <p className="text-gray-500 mb-4">Interactive learning component would be displayed here.</p>
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
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading course content...</p>
        </div>
      </div>
    );
  }
  
  if (!course) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h2 className="text-2xl font-bold mb-2">Course Not Found</h2>
        <p className="text-muted-foreground mb-6">The course you're looking for doesn't exist or you don't have access to it.</p>
        <Button onClick={() => navigate('/learner-dashboard')}>Return to Dashboard</Button>
      </div>
    );
  }
  
  const activeModuleData = course.modules.find(m => m.id === activeModule);
  
  return (
    <div className="min-h-screen bg-background">
      {/* Course Header */}
      <div className="bg-slate-950 text-white py-8">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-slate-300 hover:text-white mb-4 md:mb-0 -ml-2 md:ml-0"
              onClick={() => navigate('/learner-dashboard')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            
            <div className="flex items-center gap-3">
              <RAGStatusBadge status={course.ragStatus} />
              <span className="text-sm font-medium">
                {course.progress}% Complete
              </span>
            </div>
          </div>
          
          <h1 className="text-2xl md:text-3xl font-bold">{course.title}</h1>
          <p className="text-slate-300 mt-2 mb-4 max-w-3xl">{course.description}</p>
          
          <div className="flex flex-wrap gap-4 items-center text-sm text-slate-300">
            <div className="flex items-center">
              <Badge variant="outline" className="border-slate-700 text-slate-300">
                {course.level}
              </Badge>
            </div>
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              {course.duration}
            </div>
            <div className="flex items-center">
              <BookOpen className="w-4 h-4 mr-1" />
              {course.modules.length} Modules
            </div>
          </div>
          
          <Progress 
            value={course.progress} 
            className="mt-4 h-2 bg-slate-800" 
          />
        </div>
      </div>
      
      {/* Course Content */}
      <div className="container mx-auto px-4 md:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Module Navigation Sidebar */}
          <div className="order-2 lg:order-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="text-xl">Course Modules</CardTitle>
              </CardHeader>
              <CardContent className="px-2">
                <div className="space-y-1">
                  {course.modules.map((module, index) => (
                    <Button
                      key={module.id}
                      variant={module.id === activeModule ? "default" : "ghost"}
                      className={`w-full justify-start h-auto py-3 px-3 ${
                        module.completed ? "text-muted-foreground hover:text-primary" : ""
                      }`}
                      onClick={() => handleModuleChange(module.id)}
                    >
                      <div className="flex items-center mr-2">
                        {module.completed ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-muted text-xs">
                            {index + 1}
                          </span>
                        )}
                      </div>
                      <div className="text-left">
                        <div className="font-medium">{module.title}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {module.duration} • {module.contentType}
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Module Content */}
          <div className="lg:col-span-2 order-1 lg:order-2">
            {activeModuleData ? (
              <Card>
                <CardHeader className="flex flex-row items-start justify-between space-y-0">
                  <div>
                    <CardTitle className="text-xl mb-1">{activeModuleData.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">{activeModuleData.description}</p>
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
                
                <Separator />
                
                <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-0 rounded-none border-b">
                    <TabsTrigger value="content">Content</TabsTrigger>
                    <TabsTrigger value="resources">Resources</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="content" className="m-0">
                    <CardContent className="p-6" id="module-content">
                      {renderModuleContent(activeModuleData)}
                    </CardContent>
                  </TabsContent>
                  
                  <TabsContent value="resources" className="m-0">
                    <CardContent className="p-6">
                      {activeModuleData.resources && activeModuleData.resources.length > 0 ? (
                        <div className="space-y-3">
                          {activeModuleData.resources.map(resource => (
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
                  <Button
                    variant="outline"
                    onClick={() => navigateModule('prev')}
                    disabled={course.modules.findIndex(m => m.id === activeModule) === 0}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Previous Module
                  </Button>
                  
                  {activeModuleData.completed ? (
                    <Button
                      onClick={() => navigateModule('next')}
                      disabled={course.modules.findIndex(m => m.id === activeModule) === course.modules.length - 1}
                    >
                      Next Module
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  ) : (
                    <Button onClick={handleCompleteModule}>
                      Mark as Complete
                      <CheckCircle className="w-4 h-4 ml-2" />
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-muted-foreground">Please select a module to view its content.</p>
                </CardContent>
              </Card>
            )}
            
            {/* Feedback Button */}
            <div className="mt-6 flex justify-end">
              <Button 
                variant="outline" 
                className="flex items-center" 
                onClick={() => setShowFeedbackForm(true)}
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Provide Feedback
              </Button>
            </div>
            
            {/* Feedback Form would be implemented here */}
            {showFeedbackForm && (
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="text-lg">Provide Feedback</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Your feedback helps us improve our course content and your learning experience.
                  </p>
                  <div className="space-y-4">
                    {/* Feedback form fields would go here */}
                    <p className="text-center text-muted-foreground">
                      Feedback form would be implemented here.
                    </p>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowFeedbackForm(false)}>
                    Cancel
                  </Button>
                  <Button>
                    Submit Feedback
                  </Button>
                </CardFooter>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseView; 