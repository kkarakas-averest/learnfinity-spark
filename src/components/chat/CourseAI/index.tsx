import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Loader2, FileText, User, Book, Award, BookOpen, Bookmark, BarChart2, CheckCircle, ChevronDown, ChevronUp, RefreshCw, AlertCircle, Zap } from "lucide-react";
import SendIcon from '@/components/icons/SendIcon';
import BotIcon from '@/components/icons/BotIcon';
import { useToast } from "@/components/ui/use-toast";
import { supabase } from '@/lib/supabase';
import {
  Accordion,
  AccordionContent,
  AccordionTrigger,
} from "@/components/ui/accordion";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Create AccordionItem since it's not exported from accordion.tsx
const AccordionItem = AccordionPrimitive.Item;

// Local PlusIcon definition
const PlusIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24" 
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

type Message = {
  id: string;
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isLoading?: boolean;
};

type CourseAIProps = {
  employeeId?: string; // Optional: pre-select an employee for course generation
  initialMessage?: string; // Optional: start with a specific message
};

// Enhanced interface for employee context data
interface EmployeeContext {
  employee: {
    id: string;
    name: string;
    email?: string;
    department?: string;
    position?: string;
    cv_file_url?: string;
    cv_extracted_data?: any;
    [key: string]: any;
  };
  courses: Array<{
    id: string;
    title: string;
    description?: string;
    [key: string]: any;
  }>;
  skills: Array<{
    name: string;
    proficiency_level?: number;
    gap_level?: number;
    is_missing?: boolean;
  }>;
  missingSkills?: Array<{
    name: string;
    gap_level?: number;
  }>;
  resources?: Array<{
    id: string;
    title: string;
    type: 'article' | 'video' | 'book' | 'course' | 'other';
    url?: string;
    description?: string;
  }>;
  knowledgeBase?: Array<{
    id: string;
    title: string;
    category: string;
    proficiency: number;
    lastAccessed?: string;
    importance: 'high' | 'medium' | 'low';
  }>;
  knowledgeGaps?: Array<{
    id: string;
    topic: string;
    priority: 'critical' | 'important' | 'moderate' | 'low';
    relevance: number;
    recommendedResources?: Array<{
      id: string;
      title: string;
      type: string;
    }>;
  }>;
}

// Simple Markdown-to-HTML conversion function
const convertMarkdownToHtml = (markdown: string): string => {
  // Handle bold text
  let html = markdown.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Handle numbered lists
  html = html.replace(/^\d+\.\s+(.*?)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*?<\/li>(\n|$))+/g, '<ol>$&</ol>');
  
  // Handle bullet points
  html = html.replace(/^•\s+(.*?)$/gm, '<li>$1</li>');
  html = html.replace(/^\*\s+(.*?)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*?<\/li>(\n|$))+/g, '<ul>$&</ul>');
  
  // Handle headers (h3)
  html = html.replace(/^###\s+(.*?)$/gm, '<h3>$1</h3>');
  
  // Handle headers (h2)
  html = html.replace(/^##\s+(.*?)$/gm, '<h2>$1</h2>');
  
  // Handle headers (h1)
  html = html.replace(/^#\s+(.*?)$/gm, '<h1>$1</h1>');
  
  // Handle paragraphs
  html = html.replace(/(?:\r\n|\r|\n){2,}/g, '</p><p>');
  html = `<p>${html}</p>`;
  html = html.replace(/<p><\/p>/g, '');
  
  return html;
};

export function CourseAI({ employeeId, initialMessage }: CourseAIProps) {
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [input, setInput] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [isFetchingEmployeeData, setIsFetchingEmployeeData] = React.useState(false);
  const [employeeContext, setEmployeeContext] = React.useState<EmployeeContext | null>(null);
  const [showEmployeePanel, setShowEmployeePanel] = React.useState(true);
  const [selectedResource, setSelectedResource] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState('chat');
  const endOfMessagesRef = React.useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Initialize conversation with a welcome message
  React.useEffect(() => {
    // Add system welcome message
    const initialSystemMessage: Message = {
      id: crypto.randomUUID(),
      role: 'system',
      content: 'Welcome to the Course Designer AI. I can help you create personalized learning content based on employee skills, CV data, and learning needs. How would you like to start?',
      timestamp: new Date()
    };
    setMessages([initialSystemMessage]);

    // If an employeeId is provided, fetch their data
    if (employeeId) {
      fetchEmployeeContext(employeeId);
    }

    // If an initial message is provided, add it after a short delay
    if (initialMessage) {
      setTimeout(() => {
        handleSendMessage(initialMessage);
      }, 500);
    }
  }, []);

  // Auto-scroll to the bottom of the chat
  React.useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Enhanced fetch employee context with CV data and missing skills
  const fetchEmployeeContext = async (id: string) => {
    setIsFetchingEmployeeData(true);
    try {
      console.log('Fetching employee data for ID:', id);
      
      // Fetch employee details with CV data
      const { data: employee, error: employeeError } = await supabase
        .from('hr_employees')
        .select('*, cv_extracted_data, cv_file_url')
        .eq('id', id)
        .single();

      if (employeeError) {
        console.error('Error fetching employee:', employeeError);
        throw employeeError;
      }
      
      console.log('Employee data fetched successfully');
      
      // Fetch employee's assigned courses
      const { data: courseEnrollments, error: coursesError } = await supabase
        .from('hr_course_enrollments')
        .select(`
          id,
          course_id,
          status,
          progress
        `)
        .eq('employee_id', id);
        
      if (coursesError) {
        console.error('Error fetching course enrollments:', coursesError);
        throw coursesError;
      }
      
      console.log(`Found ${courseEnrollments?.length || 0} course enrollments`);
      
      // Get course details for the enrolled courses
      let courses: any[] = [];
      if (courseEnrollments && courseEnrollments.length > 0) {
        // Extract course IDs from enrollments, filter out null/undefined
        const courseIds = courseEnrollments.map(enrollment => enrollment.course_id).filter(Boolean);
        console.log('Course IDs for lookup:', courseIds);

        if (courseIds.length > 0) {
          try {
            // Fetch course details
            const { data: courseData, error: courseDetailsError } = await supabase
              .from('hr_courses')
              .select(`
                id,
                title,
                description,
                estimated_duration,
                difficulty_level,
                is_active
              `)
              .in('id', courseIds);
            
            if (courseDetailsError) {
              console.error('Error fetching course details:', courseDetailsError);
              // Don't throw error, just log it - we can continue with limited data
            } 
            
            console.log('Fetched course data:', courseData);
            
            // If we have course data, use it to populate courses
            if (courseData && courseData.length > 0) {
              console.log('Using course data from hr_courses table');
              courses = courseEnrollments.map(enrollment => {
                const courseDetails = courseData?.find(course => course.id === enrollment.course_id) || {
                  title: 'Unknown Course',
                  description: null,
                  estimated_duration: null,
                  difficulty_level: null,
                  is_active: null
                };
                return {
                  id: enrollment.course_id,
                  title: courseDetails.title,
                  description: courseDetails.description,
                  estimatedDuration: courseDetails.estimated_duration,
                  difficultyLevel: courseDetails.difficulty_level,
                  isActive: courseDetails.is_active,
                  status: enrollment.status,
                  progress: enrollment.progress
                };
              });
            } else {
              // If no course data found, use enrollment data directly
              console.log('No course data found in hr_courses. Using enrollments directly.');
              courses = courseEnrollments.map(enrollment => ({
                id: enrollment.course_id,
                title: `Course ID: ${enrollment.course_id.substring(0, 8)}...`,
                description: 'Course details not available',
                status: enrollment.status,
                progress: enrollment.progress || 0
              }));
            }
          } catch (error) {
            console.error('Error in course data processing:', error);
            // Fallback to using enrollment data directly
            courses = courseEnrollments.map(enrollment => ({
              id: enrollment.course_id,
              title: `Course ID: ${enrollment.course_id.substring(0, 8)}...`,
              description: 'Course details not available',
              status: enrollment.status,
              progress: enrollment.progress || 0
            }));
          }
        } else {
          console.log('No valid course IDs found in enrollments');
        }
        
        console.log('Final courses data:', courses);
      }
      
      // Get employee skills from assessments
      // Get the latest assessment id for this employee
      const { data: assessmentRows, error: assessmentError } = await supabase
        .from('hr_skill_assessments')
        .select('id')
        .eq('employee_id', id)
        .order('assessed_at', { ascending: false })
        .limit(1);
      
      if (assessmentError) {
        console.error('Error fetching skill assessments:', assessmentError);
        throw assessmentError;
      }
      
      const assessmentIds = assessmentRows && assessmentRows.length > 0 
        ? assessmentRows.map((row: { id: string }) => row.id) 
        : [];
      
      console.log('Assessment IDs:', assessmentIds);
      
      let skills: any[] = [];
      let missingSkills: any[] = [];
      
      // Only try to get skills if we have assessment IDs
      if (assessmentIds.length > 0) {
        // Get existing skills
        const { data: skillsData, error: skillsError } = await supabase
          .from('hr_skill_assessment_details')
          .select(`
            skill_name,
            proficiency_level,
            gap_level,
            is_missing
          `)
          .eq('is_missing', false)
          .in('assessment_id', assessmentIds);
        
        if (skillsError) {
          console.error('Error fetching skills:', skillsError);
          throw skillsError;
        }
        
        skills = skillsData || [];
        console.log(`Found ${skills.length} existing skills`);
        
        // Get missing skills
        const { data: missingSkillsData, error: missingSkillsError } = await supabase
          .from('hr_skill_assessment_details')
          .select(`
            skill_name,
            gap_level
          `)
          .eq('is_missing', true)
          .in('assessment_id', assessmentIds);
        
        if (missingSkillsError) {
          console.error('Error fetching missing skills:', missingSkillsError);
          throw missingSkillsError;
        }
        
        missingSkills = missingSkillsData || [];
        console.log(`Found ${missingSkills.length} missing skills`);
      } else {
        console.log('No assessments found, using empty skills arrays');
      }
      
      // Generate mock resources for demo (would be fetched from database in production)
      const mockResources = [
        {
          id: crypto.randomUUID(),
          title: "Advanced JavaScript Techniques",
          type: "article" as const,
          url: "https://example.com/articles/javascript",
          description: "Comprehensive guide to advanced JS patterns"
        },
        {
          id: crypto.randomUUID(),
          title: "Leadership in Tech Teams",
          type: "video" as const,
          url: "https://example.com/videos/leadership",
          description: "Video series on effective leadership in technical teams"
        },
        {
          id: crypto.randomUUID(),
          title: "Data Science Fundamentals",
          type: "course" as const,
          url: "https://example.com/courses/data-science",
          description: "Introduction to key data science concepts"
        }
      ];
      
      // Mock knowledge management data for demo
      const mockKnowledgeBase = [
        {
          id: crypto.randomUUID(),
          title: "Web Development Fundamentals",
          category: "Technical",
          proficiency: 85,
          lastAccessed: "2023-08-15",
          importance: "high" as const
        },
        {
          id: crypto.randomUUID(),
          title: "Project Management Methodology",
          category: "Management",
          proficiency: 70,
          lastAccessed: "2023-09-22",
          importance: "medium" as const
        },
        {
          id: crypto.randomUUID(),
          title: "Data Analysis & Interpretation",
          category: "Analytics",
          proficiency: 60,
          lastAccessed: "2023-10-10",
          importance: "high" as const
        }
      ];
      
      const mockKnowledgeGaps = [
        {
          id: crypto.randomUUID(),
          topic: "Machine Learning Algorithms",
          priority: "important" as const,
          relevance: 80,
          recommendedResources: [
            {
              id: crypto.randomUUID(),
              title: "Introduction to Machine Learning",
              type: "course"
            },
            {
              id: crypto.randomUUID(),
              title: "ML Algorithms Explained",
              type: "article"
            }
          ]
        },
        {
          id: crypto.randomUUID(),
          topic: "Cloud Infrastructure",
          priority: "critical" as const,
          relevance: 90,
          recommendedResources: [
            {
              id: crypto.randomUUID(),
              title: "Cloud Computing Essentials",
              type: "course"
            }
          ]
        }
      ];
      
      // Combine data into context object
      const context: EmployeeContext = {
        employee,
        courses: courses,
        skills: (skills || []).map((s: any) => ({
          name: s.skill_name,
          proficiency_level: s.proficiency_level,
          gap_level: s.gap_level,
          is_missing: false
        })),
        missingSkills: (missingSkills || []).map((s: any) => ({
          name: s.skill_name,
          gap_level: s.gap_level
        })),
        resources: mockResources,
        knowledgeBase: mockKnowledgeBase,
        knowledgeGaps: mockKnowledgeGaps
      };
      
      console.log('Setting employee context with data:', { 
        employeeId: employee.id, 
        skillsCount: context.skills.length,
        missingSkillsCount: context.missingSkills?.length || 0,
        coursesCount: context.courses.length
      });
      
      setEmployeeContext(context);
      
      // Update the context message to remove references to knowledge
      const contextMessage: Message = {
        id: crypto.randomUUID(),
        role: 'system',
        content: `I've loaded ${employee.name}'s profile. I found:
• ${context.skills.length} existing skills
• ${context.missingSkills?.length || 0} skill gaps to address
• ${context.courses.length} current course enrollments
${employee.cv_extracted_data ? '• CV data extracted for personalized recommendations' : ''}

I'll use this information to provide highly tailored course suggestions. What would you like to know?`,
        timestamp: new Date()
      };
      
      setMessages((prev: Message[]) => [...prev, contextMessage]);
      
    } catch (error) {
      console.error('Error fetching employee context:', error);
      toast({
        title: "Error loading employee data",
        description: "Could not load employee context. Please verify the employee ID is correct and try again.",
        variant: "destructive"
      });
    } finally {
      setIsFetchingEmployeeData(false);
    }
  };

  // Send a message to the chat
  const handleSendMessage = async (messageText = input) => {
    if (!messageText.trim() && !isLoading) {
      return;
    }
    
    // Add user message to chat
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: messageText.trim(),
      timestamp: new Date()
    };
    
    // Add temporary loading message
    const loadingMessage: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isLoading: true
    };
    
    setMessages((prev: Message[]) => [...prev, userMessage, loadingMessage]);
    setInput('');
    setIsLoading(true);
    
    try {
      // Get the last few messages for context (exclude the loading message)
      const recentMessages = [...messages.slice(-5), userMessage]
        .map((m: Message) => ({ role: m.role, content: m.content }));
      
      // Add enhanced employee context if available
      const contextData = employeeContext ? {
        employeeId: employeeContext.employee.id,
        employeeName: employeeContext.employee.name,
        skills: employeeContext.skills.map((s: { name: string }) => s.name),
        missingSkills: employeeContext.missingSkills?.map((s: { name: string }) => s.name) || [],
        courses: employeeContext.courses,
        position: employeeContext.employee.position,
        department: employeeContext.employee.department,
        // Include knowledge base data
        knowledgeAreas: employeeContext.knowledgeBase?.map((k: { title: string }) => k.title) || [],
        knowledgeGaps: employeeContext.knowledgeGaps?.map((g: { topic: string }) => g.topic) || [],
        // Include full data for more context
        fullContext: {
          skills: employeeContext.skills,
          missingSkills: employeeContext.missingSkills,
          knowledgeBase: employeeContext.knowledgeBase,
          knowledgeGaps: employeeContext.knowledgeGaps
        },
        cvData: employeeContext.employee.cv_extracted_data || null
      } : null;
      
      // Send to the chat API
      const response = await fetch('/api/chat/conversation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: recentMessages,
          employeeContext: contextData
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to get response from chat API');
      }
      
      const data = await response.json();
      
      // Remove loading message and add real response
      setMessages((prev: Message[]) => {
        const filtered = prev.filter(m => !m.isLoading);
        return [
          ...filtered,
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: data.response,
            timestamp: new Date()
          }
        ];
      });
      
    } catch (error) {
      console.error('Error in chat conversation:', error);
      
      // Remove loading message and add error
      setMessages((prev: Message[]) => {
        const filtered = prev.filter(m => !m.isLoading);
        return [
          ...filtered,
          {
            id: crypto.randomUUID(),
            role: 'system',
            content: 'Sorry, I encountered an error while processing your request. Please try again.',
            timestamp: new Date()
          }
        ];
      });
      
      toast({
        title: "Chat Error",
        description: "Failed to get a response. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Render message bubble based on role with enhanced styling and markdown support
  const renderMessage = (message: Message) => {
    if (message.isLoading) {
      return (
        <div className="flex justify-start mb-4">
          <div className="flex items-start gap-2 max-w-[80%]">
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-secondary text-secondary-foreground">
              <BotIcon size={16} />
            </div>
            <div className="p-3 rounded-lg bg-secondary text-secondary-foreground rounded-tl-none flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Generating response...</span>
            </div>
          </div>
        </div>
      );
    }
    
    if (message.role === 'system') {
      return (
        <div className="bg-muted p-3 rounded-lg text-center text-sm mx-auto max-w-[85%] text-muted-foreground border border-muted-foreground/20">
          {message.content}
        </div>
      );
    }
    
    const isUser = message.role === 'user';
    const contentHtml = isUser ? message.content : convertMarkdownToHtml(message.content);
    
    return (
      <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
        <div className={`flex items-start gap-2 max-w-[80%] ${isUser ? 'flex-row-reverse' : ''}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center 
            ${isUser ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
            {isUser ? <User size={16} /> : <BotIcon size={16} />}
          </div>
          <div 
            className={`p-3 rounded-lg ${isUser ? 
              'bg-primary text-primary-foreground rounded-tr-none' : 
              'bg-secondary text-secondary-foreground rounded-tl-none markdown-content'}`}
            dangerouslySetInnerHTML={isUser ? undefined : { __html: contentHtml }}
          >
            {isUser && message.content}
          </div>
        </div>
      </div>
    );
  };

  // Employee information panel with skills, courses and CV
  const renderEmployeePanel = () => {
    if (!employeeContext) return null;
    
    const { employee, skills, missingSkills, courses, resources, knowledgeBase, knowledgeGaps } = employeeContext;
    
    return (
      <div className="border-l border-border w-80 bg-card h-full flex flex-col">
        <div className="p-3 border-b flex justify-between items-center">
          <h3 className="text-base font-semibold">Employee Profile</h3>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setShowEmployeePanel(false)}
            className="h-7 w-7"
          >
            <ChevronDown size={14} />
          </Button>
        </div>
        
        <div className="p-3 border-b">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <User size={16} />
            </div>
            <div>
              <h4 className="font-medium text-sm">{employee.name}</h4>
              <p className="text-xs text-muted-foreground">{employee.position || 'No position'}</p>
            </div>
            {employee.department && (
              <Badge variant="outline" className="ml-auto text-xs">
                {employee.department}
              </Badge>
            )}
          </div>
        </div>
        
        <Tabs defaultValue="skills" className="flex-1 flex flex-col min-h-0">
          <TabsList className="px-3 pt-2 bg-transparent">
            <TabsTrigger value="skills" className="text-xs">Skills</TabsTrigger>
            <TabsTrigger value="courses" className="text-xs">Courses</TabsTrigger>
          </TabsList>
          
          <div className="flex-1 overflow-auto p-3">
            <TabsContent value="skills" className="mt-0 h-full">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="existing-skills">
                  <AccordionTrigger className="py-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-medium">
                      <Award size={14} />
                      <span>Existing Skills ({skills.length})</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-1.5">
                    <div className="space-y-1.5">
                      {skills.map((skill: { name: string; proficiency_level?: number }) => (
                        <div key={skill.name} className="text-xs flex justify-between items-center">
                          <span>{skill.name}</span>
                          {skill.proficiency_level && (
                            <div className="flex items-center">
                              <Progress value={skill.proficiency_level * 20} className="h-1 w-16" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="missing-skills" className="mt-1">
                  <AccordionTrigger className="py-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-medium">
                      <AlertCircle size={14} className="text-amber-500" />
                      <span>Skill Gaps ({missingSkills?.length || 0})</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-1.5">
                    <div className="space-y-1.5">
                      {missingSkills?.map((skill: { name: string; gap_level?: number }) => (
                        <div key={skill.name} className="text-xs flex justify-between items-center">
                          <span>{skill.name}</span>
                          {skill.gap_level && (
                            <Badge variant={skill.gap_level > 3 ? "destructive" : "outline"} className="text-[10px] h-5">
                              Gap: {skill.gap_level}
                            </Badge>
                          )}
                        </div>
                      ))}
                      {(!missingSkills || missingSkills.length === 0) && (
                        <p className="text-xs text-muted-foreground">No skill gaps identified.</p>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </TabsContent>
            
            <TabsContent value="courses" className="max-h-[320px] overflow-y-auto mt-2">
              {courses.length > 0 ? (
                <div className="space-y-3">
                  {courses.map((course: { id: string; title: string; description?: string; progress?: number }) => (
                    <Card key={course.id} className="overflow-hidden">
                      <CardHeader className="p-3">
                        <CardTitle className="text-sm flex items-center gap-1.5">
                          <BookOpen size={14} className="flex-shrink-0" />
                          <span className="line-clamp-1">{course.title}</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-3 pt-0">
                        <div className="mb-2">
                          <Progress value={course.progress || 0} className="h-1.5" />
                          <p className="text-xs text-muted-foreground mt-1">
                            {course.progress || 0}% complete
                          </p>
                        </div>
                        {course.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {course.description}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No courses enrolled.</p>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </div>
    );
  };

  // Toggle panel button
  const renderTogglePanelButton = () => {
    if (showEmployeePanel || !employeeContext) return null;
    
    return (
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-2 top-2 h-8 w-8"
        onClick={() => setShowEmployeePanel(true)}
      >
        <ChevronUp size={16} />
      </Button>
    );
  };

  return (
    <Card className="w-full h-[600px] max-h-[80vh] flex flex-col relative">
      <CardHeader className="px-4 py-2 border-b flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText size={18} />
          Course Designer AI
        </CardTitle>
        <div className="flex items-center gap-2">
          {employeeContext && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7"
                    onClick={() => fetchEmployeeContext(employeeContext.employee.id)}
                  >
                    <RefreshCw size={14} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Refresh employee data</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </CardHeader>
      
      <div className="flex flex-grow h-0 overflow-hidden">
        <CardContent className="flex-grow overflow-y-auto p-4 pb-0 relative">
          <div className="space-y-4">
            {messages.map((message: Message) => (
              <div key={message.id} className="chat-message">
                {renderMessage(message)}
              </div>
            ))}
            {(isLoading || isFetchingEmployeeData) && !messages.some((m: Message) => m.isLoading) && (
              <div className="flex justify-center items-center py-2">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            )}
            <div ref={endOfMessagesRef} />
          </div>
          {renderTogglePanelButton()}
        </CardContent>
        
        {employeeContext && showEmployeePanel && renderEmployeePanel()}
      </div>
      
      <CardFooter className="p-3 border-t">
        <div className="flex w-full items-center gap-2">
          <Input
            value={input}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type a message or ask about designing a course..."
            disabled={isLoading}
            className="flex-grow"
          />
          <Button 
            onClick={() => handleSendMessage()} 
            disabled={isLoading || !input.trim()} 
            size="icon"
            variant="default"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendIcon className="h-4 w-4" />}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
} 