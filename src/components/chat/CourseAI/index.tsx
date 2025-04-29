import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Loader2, FileText, User, Book, Award, BookOpen, Bookmark, BarChart2, CheckCircle, ChevronDown, ChevronUp, RefreshCw, AlertCircle, Zap, Upload, Menu, ArrowLeft, ArrowRight } from "lucide-react";
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
import { uploadCommandSchema, generateCommandSchema, publishCommandSchema, courseAICommandSchema, type CourseAICommand } from '@/types/ai-course-schema';
import { cn } from "@/lib/utils";

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

// Command Sidebar component to provide persistent but expandable command visibility
const CommandSidebar = ({ 
  onCommandClick, 
  isExpanded,
  onToggle
}: { 
  onCommandClick: (command: string) => void;
  isExpanded: boolean;
  onToggle: () => void;
}) => (
  <div className={cn(
    "h-full bg-card border-r border-border transition-all duration-200 overflow-hidden",
    isExpanded ? "w-64" : "w-12"
  )}>
    <div className="flex flex-col h-full">
      <div className="border-b p-3 flex items-center justify-between">
        {isExpanded && <h3 className="text-sm font-semibold">Commands</h3>}
        <Button variant="ghost" size="icon" onClick={onToggle} className="h-8 w-8">
          {isExpanded ? <ArrowLeft className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2">
        {[
          { command: "/upload", description: "Upload documents", color: "bg-blue-500", icon: <Upload className="h-4 w-4" /> },
          { command: "/generate", description: "Create a course", color: "bg-green-500", icon: <Book className="h-4 w-4" /> },
          { command: "/publish", description: "Publish to employees", color: "bg-amber-500", icon: <CheckCircle className="h-4 w-4" /> },
          { command: "/bulk", description: "Bulk course generation", color: "bg-purple-500", icon: <BarChart2 className="h-4 w-4" /> },
          { command: "/employees", description: "List all employees", color: "bg-teal-500", icon: <User className="h-4 w-4" /> }
        ].map((cmd) => (
          <TooltipProvider key={cmd.command}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onCommandClick(cmd.command)}
                  className={cn(
                    "w-full mb-2 rounded-md text-left transition-colors",
                    isExpanded 
                      ? `${cmd.color} text-white px-3 py-2 hover:opacity-90` 
                      : "bg-muted hover:bg-muted/80 p-2 flex justify-center"
                  )}
                >
                  {isExpanded ? (
                    <div className="flex items-center justify-between">
                      <span>{cmd.command}</span>
                      <span className="text-xs opacity-80">{cmd.description}</span>
                    </div>
                  ) : (
                    <div className="text-foreground">{cmd.icon}</div>
                  )}
                </button>
              </TooltipTrigger>
              {!isExpanded && (
                <TooltipContent side="right">
                  <p>{cmd.command}</p>
                  <p className="text-xs text-muted-foreground">{cmd.description}</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>
    </div>
  </div>
);

// Command autocomplete component that appears when typing "/"
const CommandAutocomplete = ({ onSelect }: { onSelect: (command: string) => void }) => {
  const commands = [
    { command: "/upload", description: "Upload documents for course generation" },
    { command: "/generate", description: "Create a new course with the given title" },
    { command: "/publish", description: "Publish a course to employees" },
    { command: "/bulk", description: "Start bulk course generation by group" },
    { command: "/employees", description: "List all employees and their info" },
    { command: "/departments", description: "List all departments" },
    { command: "/positions", description: "List all job positions" },
    { command: "/courses", description: "List existing courses" }
  ];
  
  return (
    <div className="absolute bottom-14 left-0 right-0 bg-card border rounded-lg shadow-lg py-2">
      {commands.map((cmd) => (
        <button
          key={cmd.command}
          onClick={() => onSelect(cmd.command)}
          className="w-full text-left px-4 py-2 hover:bg-accent flex items-center justify-between"
        >
          <span className="font-medium">{cmd.command}</span>
          <span className="text-xs text-muted-foreground">{cmd.description}</span>
        </button>
      ))}
    </div>
  );
};

type Message = {
  id: string;
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isLoading?: boolean;
};

type CommandState = {
  processing: boolean;
  type: 'upload' | 'generate' | 'publish' | null;
  progress: number;
  status: string;
  data?: any;
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
  knowledgeBase?: {
    id: string;
    title: string;
    category: string;
    importance: "high" | "medium" | "low";
    proficiency: number;
    lastAccessed?: string;
  }[];
  knowledgeGaps?: {
    id: string;
    topic: string;
    priority: "important" | "critical" | "moderate" | "low";
    relevance: number;
    recommendedResources?: {
      id: string;
      title: string;
      type: string;
    }[];
  }[];
}

// Simple HTML escape function
const escapeHtml = (text: string) =>
  text.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));

// CoursePreviewCard component to enhance visualization of generated courses
const CoursePreviewCard = ({ course }: { course: any }) => (
  <div className="bg-card border rounded-lg overflow-hidden mt-4 mb-6 shadow-sm">
    <div className="bg-primary/10 p-4">
      <h3 className="font-bold text-lg">{course.title}</h3>
      <p className="text-sm text-muted-foreground mt-1">{course.description}</p>
    </div>
    <div className="p-4 space-y-4">
      <div className="space-y-1">
        <h4 className="text-sm font-medium">Learning Objectives</h4>
        <ul className="text-sm space-y-1">
          {course.learningObjectives?.map((obj: string, i: number) => (
            <li key={i} className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <span>{obj}</span>
            </li>
          ))}
        </ul>
      </div>
      
      <div>
        <h4 className="text-sm font-medium mb-1">Content Overview</h4>
        <div className="space-y-2">
          {course.sections?.map((section: any, i: number) => (
            <div key={i} className="text-sm">
              <div className="font-medium">{i+1}. {section.title}</div>
              <div className="text-muted-foreground text-xs mt-0.5 line-clamp-2">
                {section.content ? section.content.substring(0, 100) + '...' : 'No content available'}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="flex justify-between items-center pt-2">
        <Badge variant="outline" className="flex items-center gap-1">
          <BookOpen className="h-3 w-3" />
          {course.sections?.length || 0} sections
        </Badge>
        <Button size="sm" onClick={() => window.navigator.clipboard.writeText(course.id)}>
          Copy ID
        </Button>
      </div>
    </div>
  </div>
);

export function CourseAI({ employeeId, initialMessage }: CourseAIProps) {
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [input, setInput] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [isFetchingEmployeeData, setIsFetchingEmployeeData] = React.useState(false);
  const [employeeContext, setEmployeeContext] = React.useState<EmployeeContext | null>(null);
  const [showEmployeePanel, setShowEmployeePanel] = React.useState(true);
  const [selectedResource, setSelectedResource] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState('chat');
  const [commandState, setCommandState] = React.useState<CommandState>({
    processing: false,
    type: null,
    progress: 0,
    status: ''
  });
  const [fileInputRef] = React.useState<React.RefObject<HTMLInputElement>>(React.createRef());
  const [showCommandAutocomplete, setShowCommandAutocomplete] = React.useState(false);
  const [isCommandSidebarExpanded, setIsCommandSidebarExpanded] = React.useState(false);
  
  const endOfMessagesRef = React.useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Initialize conversation with a welcome message
  React.useEffect(() => {
    // Add system welcome message
    const initialSystemMessage: Message = {
      id: crypto.randomUUID(),
      role: 'system',
      content: 'Welcome to the Course Designer AI. I can help you create personalized learning content based on employee skills, CV data, and learning needs.\n\nUse the command sidebar on the left to access available commands, or type "/" to see all options.\n\nHow would you like to start?',
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
      
      // Fetch employee details with CV data and position join
      const { data: employee, error: employeeError } = await supabase
        .from('hr_employees')
        .select(`*, hr_positions ( title )`)
        .eq('id', id)
        .single();

      if (employeeError) {
        console.error('Error fetching employee:', employeeError);
        throw employeeError;
      }
      
      // Map position from join
      const position = employee.hr_positions?.title || 'Unknown';
      employee.position = position;
      
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
                difficulty_level
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
                  difficulty_level: null
                };
                return {
                  id: enrollment.course_id,
                  title: courseDetails.title,
                  description: courseDetails.description,
                  estimatedDuration: courseDetails.estimated_duration,
                  difficultyLevel: courseDetails.difficulty_level,
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
      
      // Creating a demo resources array
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
      
      // Mock knowledge base for the employee
      const mockKnowledgeBase = [
        {
          id: "kb1",
          title: "React Component Architecture",
          category: "Frontend Development",
          importance: "high" as const,
          proficiency: 85
        },
        {
          id: "kb2",
          title: "State Management Patterns",
          category: "Software Design",
          importance: "high" as const,
          proficiency: 70
        },
        {
          id: "kb3",
          title: "TypeScript Advanced Types",
          category: "Programming Languages",
          importance: "medium" as const,
          proficiency: 65
        },
        {
          id: "kb4",
          title: "Microservices Communication",
          category: "System Design",
          importance: "medium" as const,
          proficiency: 60
        },
        {
          id: "kb5",
          title: "Performance Optimization",
          category: "Web Development",
          importance: "high" as const,
          proficiency: 75
        }
      ];
      
      // Mock knowledge gaps for the employee
      const mockKnowledgeGaps = [
        {
          id: "kg1",
          topic: "GraphQL API Design",
          priority: "important" as const,
          relevance: 85,
          recommendedResources: [
            {
              id: "kgr1",
              title: "GraphQL Fundamentals",
              type: "course"
            },
            {
              id: "kgr2",
              title: "Building Scalable APIs with GraphQL",
              type: "article"
            }
          ]
        },
        {
          id: "kg2",
          topic: "Containerization & Kubernetes",
          priority: "critical" as const,
          relevance: 90,
          recommendedResources: [
            {
              id: "kgr3",
              title: "Docker & Kubernetes: The Complete Guide",
              type: "course"
            },
            {
              id: "kgr4",
              title: "Microservices Deployment Patterns",
              type: "video"
            }
          ]
        },
        {
          id: "kg3",
          topic: "AI/ML Integration in Web Apps",
          priority: "moderate" as const,
          relevance: 70,
          recommendedResources: [
            {
              id: "kgr5",
              title: "Practical Machine Learning for Frontend Devs",
              type: "workshop"
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
      
      // Update the context message to always include position and courses
      const contextMessage: Message = {
        id: crypto.randomUUID(),
        role: 'system',
        content: `I've loaded ${employee.name}'s profile. I found:
• Position: ${position}
• ${context.skills.length} existing skills
• ${context.missingSkills?.length || 0} skill gaps to address
• ${context.courses.length ? context.courses.length : 'No'} current course enrollments
${employee.cv_extracted_data ? '• CV data extracted for personalized recommendations' : ''}
\nYou already have all the above. Do NOT ask the user for it again.\n\nI'll use this information to provide highly tailored course suggestions. What would you like to know?`,
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

  // Check if the input is a command
  const checkForCommands = (text: string): { isCommand: boolean; commandText: string } => {
    const trimmedText = text.trim();
    if (trimmedText.startsWith('/')) {
      return { isCommand: true, commandText: trimmedText };
    }
    return { isCommand: false, commandText: '' };
  };

  // Parse command to detect which command is being used
  const parseCommand = (commandText: string): { command: string; args: string } => {
    const parts = commandText.split(' ');
    const command = parts[0].toLowerCase();
    const args = parts.slice(1).join(' ');
    return { command, args };
  };

  // Handle upload command
  const handleUploadCommand = async () => {
    // Create a prompt for file upload
    const uploadPrompt: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: 'Please select files to upload for course content generation.',
      timestamp: new Date()
    };
    setMessages((prev: Message[]) => [...prev, uploadPrompt]);
    
    // Set command state for file upload
    setCommandState({
      processing: true,
      type: 'upload',
      progress: 0,
      status: 'Waiting for file selection...'
    });
    
    // Trigger file input click
    setTimeout(() => {
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
    }, 100);
  };

  // Handle file selection and upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      setCommandState({
        processing: false,
        type: null,
        progress: 0,
        status: ''
      });
      
      setMessages((prev: Message[]) => [
        ...prev, 
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: 'File upload canceled.',
          timestamp: new Date()
        }
      ]);
      return;
    }
    
    // Indicate files are selected
    setCommandState({
      processing: true,
      type: 'upload',
      progress: 10,
      status: `Processing ${files.length} file(s)...`
    });
    
    // Show selected files in chat
    const fileList = Array.from(files as FileList).map((file) => `• ${file.name} (${(file.size / 1024).toFixed(1)} KB)`).join('\n');
    setMessages((prev: Message[]) => [
      ...prev, 
      {
        id: crypto.randomUUID(),
        role: 'system',
        content: `Selected files:\n${fileList}`,
        timestamp: new Date()
      }
    ]);
    
    try {
      // Process each file and upload it to the server
      const uploadIds: string[] = [];
      
      for (const file of Array.from(files as FileList)) {
        // Update progress for this file
        setCommandState({
          processing: true,
          type: 'upload',
          progress: 30,
          status: `Uploading ${file.name}...`
        });
        
        // Convert file to base64
        const reader = new FileReader();
        const fileBase64 = await new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        
        // Call the upload API
        const response = await fetch('/api/uploads', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer dev-hr-dashboard-token',
          },
          body: JSON.stringify({
            file: fileBase64,
            fileName: file.name,
            fileType: file.type
          }),
        });
        
        if (!response.ok) {
          throw new Error(`Failed to upload file: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (result.success && result.uploadId) {
          uploadIds.push(result.uploadId);
        }
      }
      
      setCommandState({
        processing: true,
        type: 'upload',
        progress: 70,
        status: 'Processing files...'
      });
      
      // Store the upload IDs in state for later use
      setCommandState({
        processing: false,
        type: null,
        progress: 100,
        status: 'Upload complete!',
        data: {
          uploadIds
        }
      });
      
      // Provide completion message
      setMessages((prev: Message[]) => [
        ...prev, 
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `Files uploaded successfully! They're now ready to be used for course generation. You can use the \`/generate [title]\` command to create a course using these materials.`,
          timestamp: new Date()
        }
      ]);
      
    } catch (error) {
      console.error('Error uploading files:', error);
      setCommandState({
        processing: false,
        type: null,
        progress: 0,
        status: ''
      });
      
      setMessages((prev: Message[]) => [
        ...prev, 
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: 'There was an error uploading your files. Please try again.',
          timestamp: new Date()
        }
      ]);
      
      toast({
        title: "Upload Error",
        description: `Failed to upload files: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    }
    
    // Clear file input for future uploads
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle generate command
  const handleGenerateCommand = async (title: string) => {
    if (!title.trim()) {
      setMessages((prev: Message[]) => [
        ...prev, 
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: 'Please provide a title for the course you want to generate. Example: `/generate Advanced JavaScript for Frontend Developers`',
          timestamp: new Date()
        }
      ]);
      return;
    }
    
    if (!employeeContext) {
      setMessages((prev: Message[]) => [
        ...prev, 
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: 'Please select an employee first before generating a course.',
          timestamp: new Date()
        }
      ]);
      return;
    }
    
    // Start generation process
    setCommandState({
      processing: true,
      type: 'generate',
      progress: 0,
      status: 'Preparing to generate course...'
    });
    
    setMessages((prev: Message[]) => [
      ...prev, 
      {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `I'll create a course titled "${title}" for ${employeeContext.employee.name}. This may take a few moments...`,
        timestamp: new Date()
      }
    ]);
    
    try {
      // Get upload IDs from previous upload command, if any
      const uploadIds = commandState.data?.uploadIds || [];
      
      // Get skills to address from the employee context
      const skillsToAddress = employeeContext.missingSkills?.map((s: { name: string }) => s.name) || [];
      
      // Update status
      setCommandState({
        processing: true,
        type: 'generate',
        progress: 20,
        status: 'Analyzing employee skills and knowledge gaps...'
      });
      
      // Call the course generation API
      const response = await fetch('/api/courses/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer dev-hr-dashboard-token',
        },
        body: JSON.stringify({
          employeeId: employeeContext.employee.id,
          title,
          description: `A personalized course on ${title} for ${employeeContext.employee.name}`,
          skillsToAddress,
          difficultyLevel: 'intermediate',
          uploadIds
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to generate course: ${errorData.error || response.statusText}`);
      }
      
      // Update progress
      setCommandState({
        processing: true,
        type: 'generate',
        progress: 60,
        status: 'Processing generated content...'
      });
      
      // Parse response
      const result = await response.json();
      
      if (!result.success || !result.contentId) {
        throw new Error(`Failed to generate course: ${result.error || 'Unknown error'}`);
      }
      
      // Finish generation process
      setCommandState({
        processing: false,
        type: null,
        progress: 100,
        status: 'Course generated!',
        data: {
          contentId: result.contentId,
          title: result.title,
          courseStructure: result.courseStructure
        }
      });
      
      // Format a message showing the course structure
      const modulesList = result.courseStructure.modules
        .map((module: any, index: number) => 
          `• Module ${index + 1}: ${module.title} (${module.sectionCount} sections)`
        )
        .join('\n');
      
      // Provide completion message with course preview
      setMessages((prev: Message[]) => [
        ...prev, 
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `Course "${result.title}" has been successfully generated!\n\nContent ID: ${result.contentId}\n\nPreview of course structure:\n${modulesList}\n\nYou can now publish this course using \`/publish ${result.contentId}\``,
          timestamp: new Date()
        }
      ]);
      
    } catch (error) {
      console.error('Error generating course:', error);
      setCommandState({
        processing: false,
        type: null,
        progress: 0,
        status: ''
      });
      
      setMessages((prev: Message[]) => [
        ...prev, 
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `There was an error generating the course: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
          timestamp: new Date()
        }
      ]);
      
      toast({
        title: "Generation Error",
        description: `Failed to generate course: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    }
  };

  // Handle publish command
  const handlePublishCommand = async (contentId: string) => {
    if (!contentId.trim()) {
      setMessages((prev: Message[]) => [
        ...prev, 
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: 'Please provide a content ID to publish. Example: `/publish 123e4567-e89b-12d3-a456-426614174000`',
          timestamp: new Date()
        }
      ]);
      return;
    }
    
    if (!employeeContext) {
      setMessages((prev: Message[]) => [
        ...prev, 
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: 'Please select an employee first before publishing a course.',
          timestamp: new Date()
        }
      ]);
      return;
    }
    
    // Start publish process
    setCommandState({
      processing: true,
      type: 'publish',
      progress: 0,
      status: 'Preparing to publish course...'
    });
    
    setMessages((prev: Message[]) => [
      ...prev, 
      {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `I'll publish the course with ID "${contentId}". This will make it available to assigned employees.`,
        timestamp: new Date()
      }
    ]);
    
    try {
      // Update progress
      setCommandState({
        processing: true,
        type: 'publish',
        progress: 30,
        status: 'Creating course enrollment records...'
      });
      
      // Call the publish API
      const response = await fetch('/api/courses/publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer dev-hr-dashboard-token',
        },
        body: JSON.stringify({
          contentId,
          employeeIds: [employeeContext.employee.id],
          sendNotification: true,
          assignmentMessage: `This course was automatically generated for ${employeeContext.employee.name} using AI.`
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to publish course: ${errorData.error || response.statusText}`);
      }
      
      // Update progress
      setCommandState({
        processing: true,
        type: 'publish',
        progress: 70,
        status: 'Finalizing publication...'
      });
      
      // Parse response
      const result = await response.json();
      
      if (!result.success || !result.courseId) {
        throw new Error(`Failed to publish course: ${result.error || 'Unknown error'}`);
      }
      
      // Finish publish process
      setCommandState({
        processing: false,
        type: null,
        progress: 100,
        status: 'Course published!',
        data: {
          courseId: result.courseId,
          enrollmentIds: result.enrollmentIds,
          enrollmentCount: result.enrollmentCount
        }
      });
      
      // Provide completion message
      setMessages((prev: Message[]) => [
        ...prev, 
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `Course has been successfully published with ID "${result.courseId}"!\n\nThe course is now available to ${result.enrollmentCount} assigned employee(s) in their learning dashboard.`,
          timestamp: new Date()
        }
      ]);
      
    } catch (error) {
      console.error('Error publishing course:', error);
      setCommandState({
        processing: false,
        type: null,
        progress: 0,
        status: ''
      });
      
      setMessages((prev: Message[]) => [
        ...prev, 
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `There was an error publishing the course: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
          timestamp: new Date()
        }
      ]);
      
      toast({
        title: "Publication Error",
        description: `Failed to publish course: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    }
  };

  // Handle bulk generation command
  const handleBulkCommand = async (params: string) => {
    const [byType, groupId] = parseParams(params);
    
    if (!byType || !['position', 'department', 'course'].includes(byType.toLowerCase())) {
      setMessages((prev: Message[]) => [
        ...prev, 
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: 'Please specify how you want to group employees for bulk generation. Example: `/bulk by:department` or `/bulk by:position` or `/bulk by:course`',
          timestamp: new Date()
        }
      ]);
      return;
    }
    
    // Set command state for bulk generation
    setCommandState({
      processing: true,
      type: 'generate',
      progress: 10,
      status: `Fetching ${byType} data...`
    });
    
    try {
      // Fetch group data based on type
      let groups: any[] = [];
      let groupMessage = '';
      
      if (byType.toLowerCase() === 'department') {
        const { data, error } = await supabase
          .from('hr_departments')
          .select('id, name, hr_employees(id)')
          .order('name');
          
        if (error) throw error;
        
        groups = (data || []).map((dept: any) => ({
          id: dept.id,
          name: dept.name,
          employee_count: Array.isArray(dept.hr_employees) ? dept.hr_employees.length : 0
        }));
        
        groupMessage = "Select a department for bulk course generation:\n\n" + 
          groups.map((dept: any, index: number) => 
            `${index + 1}. ${dept.name} (${dept.employee_count} employees)`
          ).join('\n');
        
      } else if (byType.toLowerCase() === 'position') {
        const { data, error } = await supabase
          .from('hr_positions')
          .select('id, title, hr_employees(id)')
          .order('title');
          
        if (error) throw error;
        
        groups = (data || []).map((pos: any) => ({
          id: pos.id,
          name: pos.title,
          employee_count: Array.isArray(pos.hr_employees) ? pos.hr_employees.length : 0
        }));
        
        groupMessage = "Select a position for bulk course generation:\n\n" + 
          groups.map((pos: any, index: number) => 
            `${index + 1}. ${pos.name} (${pos.employee_count} employees)`
          ).join('\n');
        
      } else if (byType.toLowerCase() === 'course') {
        const { data, error } = await supabase
          .from('hr_courses')
          .select('id, title, hr_course_enrollments(id)')
          .order('title');
          
        if (error) throw error;
        
        groups = (data || []).map((course: any) => ({
          id: course.id,
          name: course.title,
          employee_count: Array.isArray(course.hr_course_enrollments) ? course.hr_course_enrollments.length : 0
        }));
        
        groupMessage = "Select a course for bulk course generation:\n\n" + 
          groups.map((course: any, index: number) => 
            `${index + 1}. ${course.name} (${course.employee_count} enrolled)`
          ).join('\n');
      }
      
      // Store the group data in command state
      setCommandState({
        processing: false,
        type: null,
        progress: 100,
        status: '',
        data: {
          groupType: byType.toLowerCase(),
          groups,
          selectedGroup: null
        }
      });
      
      // Provide selection message
      setMessages((prev: Message[]) => [
        ...prev, 
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: groupMessage + '\n\nTo select a group, respond with the number or name. Then I\'ll guide you through setting up the course template.',
          timestamp: new Date()
        }
      ]);
      
    } catch (error) {
      console.error('Error fetching group data:', error);
      setCommandState({
        processing: false,
        type: null,
        progress: 0,
        status: ''
      });
      
      setMessages((prev: Message[]) => [
        ...prev, 
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `There was an error fetching ${byType} data: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
          timestamp: new Date()
        }
      ]);
      
      toast({
        title: "Error",
        description: `Failed to fetch ${byType} data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    }
  };

  // Handle employees listing command
  const handleEmployeesCommand = async () => {
    setMessages((prev: Message[]) => [
      ...prev, 
      {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Fetching employee data...',
        timestamp: new Date()
      }
    ]);
    
    try {
      const { data, error } = await supabase
        .from('hr_employees')
        .select('id, name, email, hr_departments(name), hr_positions(title)')
        .order('name');
      
      if (error) throw error;
      
      if (!data || data.length === 0) {
        setMessages((prev: Message[]) => [
          ...prev, 
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: 'No employees found in the database.',
            timestamp: new Date()
          }
        ]);
        return;
      }
      
      // Format employees as a table
      const employeeList = data.map((emp: any) => ({
        id: emp.id,
        name: emp.name,
        email: emp.email,
        department: emp.hr_departments?.name || 'N/A',
        position: emp.hr_positions?.title || 'N/A'
      }));
      
      // Create message with list of employees
      let message = `Found ${employeeList.length} employees:\n\n`;
      
      employeeList.forEach((emp: any, index: number) => {
        message += `${index + 1}. ${emp.name} - ${emp.position} (${emp.department})\n`;
      });
      
      message += '\nTo view an employee\'s details or create a course for them, reply with their name or number.';
      
      setMessages((prev: Message[]) => {
        // Replace the loading message
        const filteredMessages = prev.filter(m => m.content !== 'Fetching employee data...');
        return [
          ...filteredMessages,
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: message,
            timestamp: new Date()
          }
        ];
      });
      
    } catch (error) {
      console.error('Error fetching employees:', error);
      
      setMessages((prev: Message[]) => {
        // Replace the loading message
        const filteredMessages = prev.filter(m => m.content !== 'Fetching employee data...');
        return [
          ...filteredMessages,
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: `Error fetching employees: ${error instanceof Error ? error.message : 'Unknown error'}`,
            timestamp: new Date()
          }
        ];
      });
      
      toast({
        title: "Error",
        description: `Failed to fetch employees: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    }
  };

  // Handle departments listing command
  const handleDepartmentsCommand = async () => {
    setMessages((prev: Message[]) => [
      ...prev, 
      {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Fetching department data...',
        timestamp: new Date()
      }
    ]);
    
    try {
      const { data, error } = await supabase
        .from('hr_departments')
        .select('id, name, hr_employees(id)')
        .order('name');
      
      if (error) throw error;
      
      if (!data || data.length === 0) {
        setMessages((prev: Message[]) => [
          ...prev.filter(m => m.content !== 'Fetching department data...'),
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: 'No departments found in the database.',
            timestamp: new Date()
          }
        ]);
        return;
      }
      
      // Format departments with employee count
      const departmentList = data.map((dept: any) => ({
        id: dept.id,
        name: dept.name,
        employeeCount: Array.isArray(dept.hr_employees) ? dept.hr_employees.length : 0
      }));
      
      // Create message with department info
      let message = `Found ${departmentList.length} departments:\n\n`;
      
      departmentList.forEach((dept: any) => {
        message += `• ${dept.name}: ${dept.employeeCount} employees\n`;
      });
      
      message += '\nYou can use `/bulk by:department` to create courses for all employees in a department.';
      
      setMessages((prev: Message[]) => [
        ...prev.filter(m => m.content !== 'Fetching department data...'),
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: message,
          timestamp: new Date()
        }
      ]);
      
    } catch (error) {
      console.error('Error fetching departments:', error);
      
      setMessages((prev: Message[]) => [
        ...prev.filter(m => m.content !== 'Fetching department data...'),
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `Error fetching departments: ${error instanceof Error ? error.message : 'Unknown error'}`,
          timestamp: new Date()
        }
      ]);
      
      toast({
        title: "Error",
        description: `Failed to fetch departments: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    }
  };

  // Handle positions listing command
  const handlePositionsCommand = async () => {
    setMessages((prev: Message[]) => [
      ...prev, 
      {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Fetching position data...',
        timestamp: new Date()
      }
    ]);
    
    try {
      const { data, error } = await supabase
        .from('hr_positions')
        .select('id, title, hr_employees(id)')
        .order('title');
      
      if (error) throw error;
      
      if (!data || data.length === 0) {
        setMessages((prev: Message[]) => [
          ...prev.filter(m => m.content !== 'Fetching position data...'),
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: 'No positions found in the database.',
            timestamp: new Date()
          }
        ]);
        return;
      }
      
      // Format positions with employee count
      const positionList = data.map((pos: any) => ({
        id: pos.id,
        title: pos.title,
        employeeCount: Array.isArray(pos.hr_employees) ? pos.hr_employees.length : 0
      }));
      
      // Create message with position info
      let message = `Found ${positionList.length} positions:\n\n`;
      
      positionList.forEach((pos: any) => {
        message += `• ${pos.title}: ${pos.employeeCount} employees\n`;
      });
      
      message += '\nYou can use `/bulk by:position` to create courses for all employees in a position.';
      
      setMessages((prev: Message[]) => [
        ...prev.filter(m => m.content !== 'Fetching position data...'),
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: message,
          timestamp: new Date()
        }
      ]);
      
    } catch (error) {
      console.error('Error fetching positions:', error);
      
      setMessages((prev: Message[]) => [
        ...prev.filter(m => m.content !== 'Fetching position data...'),
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `Error fetching positions: ${error instanceof Error ? error.message : 'Unknown error'}`,
          timestamp: new Date()
        }
      ]);
      
      toast({
        title: "Error",
        description: `Failed to fetch positions: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    }
  };

  // Handle courses listing command
  const handleCoursesCommand = async () => {
    setMessages((prev: Message[]) => [
      ...prev, 
      {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Fetching course data...',
        timestamp: new Date()
      }
    ]);
    
    try {
      const { data, error } = await supabase
        .from('hr_courses')
        .select('id, title, description, hr_course_enrollments(id)')
        .order('title');
      
      if (error) throw error;
      
      if (!data || data.length === 0) {
        setMessages((prev: Message[]) => [
          ...prev.filter(m => m.content !== 'Fetching course data...'),
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: 'No courses found in the database.',
            timestamp: new Date()
          }
        ]);
        return;
      }
      
      // Format courses with enrollment count
      const courseList = data.map((course: any) => ({
        id: course.id,
        title: course.title,
        description: course.description,
        enrollmentCount: Array.isArray(course.hr_course_enrollments) ? course.hr_course_enrollments.length : 0
      }));
      
      // Create message with course info
      let message = `Found ${courseList.length} courses:\n\n`;
      
      courseList.forEach((course: any) => {
        message += `• ${course.title} - ${course.enrollmentCount} enrolled\n`;
        if (course.description) {
          message += `  ${course.description.substring(0, 100)}${course.description.length > 100 ? '...' : ''}\n`;
        }
        message += '\n';
      });
      
      setMessages((prev: Message[]) => [
        ...prev.filter(m => m.content !== 'Fetching course data...'),
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: message,
          timestamp: new Date()
        }
      ]);
      
    } catch (error) {
      console.error('Error fetching courses:', error);
      
      setMessages((prev: Message[]) => [
        ...prev.filter(m => m.content !== 'Fetching course data...'),
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `Error fetching courses: ${error instanceof Error ? error.message : 'Unknown error'}`,
          timestamp: new Date()
        }
      ]);
      
      toast({
        title: "Error",
        description: `Failed to fetch courses: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    }
  };

  // Helper to parse params from command string
  const parseParams = (paramsString: string): [string | undefined, string | undefined] => {
    if (!paramsString) return [undefined, undefined];
    
    // Check for by:type format
    const byMatch = paramsString.match(/by:([a-zA-Z]+)/i);
    const byType = byMatch ? byMatch[1] : undefined;
    
    // Check for id: format or just an ID
    const idMatch = paramsString.match(/id:([a-zA-Z0-9-]+)/i);
    const id = idMatch ? idMatch[1] : undefined;
    
    return [byType, id];
  };

  // Process command
  const processCommand = async (commandText: string) => {
    const { command, args } = parseCommand(commandText);
    
    switch (command) {
      case '/upload':
        handleUploadCommand();
        break;
        
      case '/generate':
        handleGenerateCommand(args);
        break;
        
      case '/publish':
        handlePublishCommand(args);
        break;
        
      case '/bulk':
        handleBulkCommand(args);
        break;
        
      case '/employees':
        handleEmployeesCommand();
        break;
        
      case '/departments':
        handleDepartmentsCommand();
        break;
        
      case '/positions':
        handlePositionsCommand();
        break;
        
      case '/courses':
        handleCoursesCommand();
        break;
        
      default:
        // Handle as regular message if not a recognized command
        handleSendMessage(commandText, false);
        break;
    }
  };

  // Function to handle sending a message
  const handleSendMessage = async (userMessage?: string, checkCommand = true) => {
    // Don't send if input is empty or just whitespace
    const messageToSend = userMessage || input;
    if (!messageToSend.trim() || isLoading) return;
    
    // Check if the message is a command
    if (checkCommand) {
      const { isCommand, commandText } = checkForCommands(messageToSend);
      if (isCommand) {
        // Create the user message with the command
        const userMessageObj: Message = {
          id: crypto.randomUUID(),
          role: 'user',
          content: messageToSend,
          timestamp: new Date(),
        };
        
        // Add user message to the messages array
        setMessages((prev: Message[]) => [...prev, userMessageObj]);
        
        // Clear the input field
        setInput('');
        
        // Process the command
        await processCommand(commandText);
        return;
      }
    }
    
    // Create the user message
    const userMessageObj: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: messageToSend,
      timestamp: new Date(),
    };
    
    // Add user message and a loading message to the messages array
    const loadingMessageId = crypto.randomUUID();
    setMessages((prev: Message[]) => [
      ...prev,
      userMessageObj,
      {
        id: loadingMessageId,
        role: 'assistant',
        content: '',
        isLoading: true,
        timestamp: new Date(),
      },
    ]);
    
    // Clear the input field if we're using the input state
    if (!userMessage) {
      setInput('');
    }
    setIsLoading(true);
    
    // Scroll to the bottom
    setTimeout(() => {
      if (endOfMessagesRef.current) {
        endOfMessagesRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);

    try {
      // Get the last few messages for context (exclude the loading message)
      const recentMessages = [...messages.slice(-5), userMessageObj]
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
      
      // Define the endpoint to use
      const chatEndpoint = '/api/chat/conversation';
      console.log(`[ChatAI] Sending message to endpoint: ${chatEndpoint}`);
      
      // Send to the chat API
      const response = await fetch(chatEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer dev-hr-dashboard-token',
        },
        body: JSON.stringify({
          messages: recentMessages,
          employeeContext: contextData
        }),
      });
      
      console.log(`[ChatAI] Response status: ${response.status}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[ChatAI] Error response:', errorText);
        throw new Error(`Failed to get response from chat API: ${response.status}`);
      }
      
      const responseText = await response.text();
      console.log(`[ChatAI] Response text: ${responseText.substring(0, 100)}...`);
      
      try {
        const data = JSON.parse(responseText);
        console.log('[ChatAI] Parsed response data:', data);
        
        if (!data || !data.response) {
          throw new Error('Invalid response format');
        }
        
        // Update messages - replace loading message with actual response
        setMessages((prev: Message[]) => {
          // Filter out the loading message
          const messagesWithoutLoading = prev.filter(m => m.id !== loadingMessageId);
          
          // Add new assistant message
          return [
            ...messagesWithoutLoading,
            {
              id: crypto.randomUUID(),
              role: 'assistant',
              content: data.response,
              timestamp: new Date()
            }
          ];
        });
        
        // Force clear loading state
        setIsLoading(false);
        
        // Scroll to bottom after messages update
        setTimeout(() => {
          if (endOfMessagesRef.current) {
            endOfMessagesRef.current.scrollIntoView({ behavior: 'smooth' });
          }
        }, 100);
        
      } catch (parseError) {
        console.error('[ChatAI] Error parsing JSON response:', parseError);
        
        // Handle parse error by removing loading message and adding error message
        setMessages((prev: Message[]) => {
          // Filter out the loading message
          const filtered = prev.filter(m => m.id !== loadingMessageId);
          return [
            ...filtered,
            {
              id: crypto.randomUUID(),
              role: 'system',
              content: 'Sorry, there was an error processing the response. Please try again.',
              timestamp: new Date()
            }
          ];
        });
        
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error in chat conversation:', error);
      
      // Remove loading message and add error
      setMessages((prev: Message[]) => {
        // Filter out the loading message
        const filtered = prev.filter(m => m.id !== loadingMessageId);
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
      
      // Ensure loading state is cleared
      setIsLoading(false);
    }
  };

  // Render command progress UI
  const renderCommandProgress = () => {
    if (!commandState.processing) return null;
    
    // If we have generated course data, show the preview card
    if (commandState.type === 'generate' && commandState.data && commandState.progress === 100) {
      return (
        <div className="border-t pt-4 pb-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium">Course Generation Complete</h3>
            <Badge variant="outline" className="text-xs">
              ID: {commandState.data.id?.substring(0, 8)}
            </Badge>
          </div>
          <CoursePreviewCard course={commandState.data} />
          <div className="text-center text-xs text-muted-foreground mt-2">
            Use <code className="bg-muted px-1 py-0.5 rounded">/publish {commandState.data.id}</code> to assign this course to employees
          </div>
        </div>
      );
    }
    
    // Show progress indicator for all other states
    return (
      <div className="border-t pt-4 pb-2">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium">
            {commandState.type === 'upload' ? 'Uploading Documents' : 
             commandState.type === 'generate' ? 'Generating Course' : 
             commandState.type === 'publish' ? 'Publishing Course' : 
             'Processing Command'}
          </h3>
          <Badge variant="outline" className="text-xs">
            {commandState.progress}%
          </Badge>
        </div>
        <Progress value={commandState.progress} className="h-2" />
        <p className="text-xs text-muted-foreground mt-2">{commandState.status}</p>
      </div>
    );
  };

  // Handle command palette button click
  const handleCommandClick = (command: string) => {
    setInput(command + ' ');
    // Focus the input
    const inputElement = document.querySelector('input[name="message"]') as HTMLInputElement;
    if (inputElement) {
      inputElement.focus();
    }
  };

  // Monitor input for "/" to show command autocomplete
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInput(value);
    
    // Show autocomplete if user types "/" at the beginning or after a space
    if (value === '/' || value.endsWith(' /')) {
      setShowCommandAutocomplete(true);
    } else {
      setShowCommandAutocomplete(false);
    }
  };
  
  // Handle selecting a command from autocomplete
  const handleCommandSelect = (command: string) => {
    setInput(command + ' ');
    setShowCommandAutocomplete(false);
    // Focus the input
    const inputElement = document.querySelector('input[name="message"]') as HTMLInputElement;
    if (inputElement) {
      inputElement.focus();
    }
  };

  // Render message bubble based on role with enhanced styling and markdown support
  const renderMessage = (message: Message) => {
    // Process message content to highlight commands
    const highlightCommands = (content: string) => {
      return content.replace(
        /(\/upload|\/generate|\/publish)(\s+[^\n]+)?/g, 
        (match, command, args) => {
          let color = '';
          if (command === '/upload') color = 'bg-blue-100 text-blue-800';
          else if (command === '/generate') color = 'bg-green-100 text-green-800';
          else if (command === '/publish') color = 'bg-amber-100 text-amber-800';
          
          return `<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${color}">${command}${args || ''}</span>`;
        }
      );
    };
    
    // Apply command highlighting but maintain existing HTML/markdown
    const processedContent = 
      message.content.startsWith('```') ? 
        message.content : // Don't process code blocks
        highlightCommands(message.content);
    
    return (
      <div className={`flex gap-3 py-4 ${message.role !== 'user' ? 'bg-muted/50' : ''}`}>
        <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0">
          {message.role === 'user' ? (
            <User className="h-5 w-5 text-primary" />
          ) : message.role === 'system' ? (
            <AlertCircle className="h-5 w-5 text-muted-foreground" />
          ) : (
            <BotIcon className="h-5 w-5 text-primary" />
          )}
        </div>
        <div className={`flex-1 ${message.isLoading ? 'opacity-70' : ''}`}>
          {message.isLoading ? (
            <div className="flex items-center">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              <span className="text-sm text-muted-foreground">AI is thinking...</span>
            </div>
          ) : (
            <div 
              className="prose prose-sm dark:prose-invert prose-p:leading-relaxed prose-pre:p-0 max-w-none"
              dangerouslySetInnerHTML={{ __html: processedContent }}
            />
          )}
        </div>
      </div>
    );
  };

  // Employee information panel with skills, courses and CV
  const renderEmployeePanel = () => {
    if (!employeeContext) return null;
    
    const { employee, skills, missingSkills, courses, resources, knowledgeBase, knowledgeGaps } = employeeContext;
    
    return (
      <div className={`h-full overflow-auto transition-all ${showEmployeePanel ? 'w-80' : 'w-0'}`}>
        {employeeContext && (
          <div className="p-4">
            <div className="mb-4">
              <h3 className="text-lg font-bold">{employee.name}</h3>
              <p className="text-sm text-muted-foreground">{employee.position} • {employee.department || 'No department'}</p>
            </div>
            
            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="w-full">
                <TabsTrigger value="profile" className="flex-1">Profile</TabsTrigger>
                <TabsTrigger value="skills" className="flex-1">Skills</TabsTrigger>
                <TabsTrigger value="courses" className="flex-1">Courses</TabsTrigger>
              </TabsList>
              
              <TabsContent value="profile">
                {/* Existing profile content */}
                {/* ... */}
              </TabsContent>
              
              <TabsContent value="skills">
                {/* Existing skills content */}
                {/* ... */}
              </TabsContent>
              
              <TabsContent value="courses">
                {/* Existing courses content */}
                {/* ... */}
              </TabsContent>
            </Tabs>
          </div>
        )}
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

  // Toggle command sidebar
  const toggleCommandSidebar = () => {
    setIsCommandSidebarExpanded((prevState: boolean) => !prevState);
  };

  return (
    <div className="flex h-[calc(100vh-13rem)] md:h-[calc(100vh-12rem)] lg:h-[calc(100vh-10rem)] rounded-md border overflow-hidden relative">
      {/* Command Sidebar */}
      <CommandSidebar 
        onCommandClick={handleCommandClick} 
        isExpanded={isCommandSidebarExpanded}
        onToggle={toggleCommandSidebar}
      />
      
      {/* Main chat area */}
      <div className="flex-1 flex flex-col h-full">
        {/* Messages container */}
        <div className="flex-1 overflow-auto p-4">
          {messages.map(renderMessage)}
          <div ref={endOfMessagesRef} />
        </div>
        
        {/* Command state visualization */}
        {commandState.processing && renderCommandProgress()}
        
        {/* User input area */}
        <div className="border-t p-4 relative">
          {showCommandAutocomplete && (
            <CommandAutocomplete onSelect={handleCommandSelect} />
          )}
          
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex space-x-2"
          >
            <Input
              name="message"
              placeholder="Type a message or command (try /upload, /generate, /publish)..."
              value={input}
              onChange={handleInputChange}
              disabled={isLoading}
              className="flex-1"
            />
            <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendIcon className="h-4 w-4" />}
            </Button>
          </form>
        </div>
      </div>
      
      {/* Employee info panel */}
      {renderEmployeePanel()}
      
      {/* Toggle panel button */}
      {renderTogglePanelButton()}
      
      {/* Hidden file input for uploads */}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        accept=".pdf,.docx,.pptx,.xlsx,.txt"
        multiple
        onChange={handleFileUpload}
      />
    </div>
  );
} 