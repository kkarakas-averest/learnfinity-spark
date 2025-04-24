import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Loader2, FileText, User } from "lucide-react";
import SendIcon from '@/components/icons/SendIcon';
import BotIcon from '@/components/icons/BotIcon';
import { useToast } from "@/components/ui/use-toast";
import { supabase } from '@/lib/supabase';

type Message = {
  id: string;
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp: Date;
};

type CourseAIProps = {
  employeeId?: string; // Optional: pre-select an employee for course generation
  initialMessage?: string; // Optional: start with a specific message
};

// Interface for employee context data
interface EmployeeContext {
  employee: {
    id: string;
    name: string;
    [key: string]: any;
  };
  courses: any[];
  skills: string[];
}

export function CourseAI({ employeeId, initialMessage }: CourseAIProps) {
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [input, setInput] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [isFetchingEmployeeData, setIsFetchingEmployeeData] = React.useState(false);
  const [employeeContext, setEmployeeContext] = React.useState<EmployeeContext | null>(null);
  const endOfMessagesRef = React.useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Initialize conversation with a welcome message
  React.useEffect(() => {
    // Add system welcome message
    const initialSystemMessage: Message = {
      id: crypto.randomUUID(),
      role: 'system',
      content: 'Welcome to the Course Designer AI. I can help you create custom learning content based on employee skills and needs. How would you like to start?',
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

  // Fetch employee context (skills, courses, etc.)
  const fetchEmployeeContext = async (id: string) => {
    setIsFetchingEmployeeData(true);
    try {
      // Fetch employee details
      const { data: employee, error: employeeError } = await supabase
        .from('hr_employees')
        .select('*')
        .eq('id', id)
        .single();

      if (employeeError) throw employeeError;
      
      // Fetch employee's assigned courses
      const { data: courses, error: coursesError } = await supabase
        .from('hr_course_enrollments')
        .select(`
          course_id,
          hr_courses (
            id,
            title,
            description
          )
        `)
        .eq('employee_id', id);
        
      if (coursesError) throw coursesError;
      
      // Get employee skills from assessments
      // Get the latest assessment id for this employee
      const { data: assessmentRows } = await supabase
        .from('hr_skill_assessments')
        .select('id')
        .eq('employee_id', id)
        .order('assessed_at', { ascending: false })
        .limit(1);
      const assessmentIds = assessmentRows ? assessmentRows.map((row: { id: string }) => row.id) : [];
      const { data: skills, error: skillsError } = await supabase
        .from('hr_skill_assessment_details')
        .select(`
          skill_name,
          proficiency_level,
          gap_level,
          is_missing
        `)
        .eq('is_missing', false)
        .in('assessment_id', assessmentIds);
      
      if (skillsError) throw skillsError;
      
      // Combine data into context object
      const context: EmployeeContext = {
        employee,
        courses: courses.map((c: any) => c.hr_courses),
        skills: skills.map((s: any) => s.skill_name)
      };
      
      setEmployeeContext(context);
      
      // Add a message about the loaded context
      const contextMessage: Message = {
        id: crypto.randomUUID(),
        role: 'system',
        content: `I've loaded ${employee.name}'s profile. They have ${context.skills.length} identified skills and ${context.courses.length} assigned courses.`,
        timestamp: new Date()
      };
      
      setMessages((prev: Message[]) => [...prev, contextMessage]);
      
    } catch (error) {
      console.error('Error fetching employee context:', error);
      toast({
        title: "Error loading employee data",
        description: "Could not load employee context. Some features may be limited.",
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
    
    setMessages((prev: Message[]) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    try {
      // Get the last few messages for context
      const recentMessages = [...messages.slice(-5), userMessage]
        .map((m: Message) => ({ role: m.role, content: m.content }));
      
      // Add employee context if available
      const contextData = employeeContext ? {
        employeeId: employeeContext.employee.id,
        employeeName: employeeContext.employee.name,
        skills: employeeContext.skills,
        courses: employeeContext.courses
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
      
      // Add assistant message to chat
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      };
      
      setMessages((prev: Message[]) => [...prev, assistantMessage]);
      
    } catch (error) {
      console.error('Error in chat conversation:', error);
      
      // Add error message
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: 'system',
        content: 'Sorry, I encountered an error while processing your request. Please try again.',
        timestamp: new Date()
      };
      
      setMessages((prev: Message[]) => [...prev, errorMessage]);
      
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

  // Render message bubble based on role
  const renderMessage = (message: Message) => {
    if (message.role === 'system') {
      return (
        <div className="bg-muted p-3 rounded-lg text-center text-sm mx-auto max-w-[85%] text-muted-foreground">
          {message.content}
        </div>
      );
    }
    
    const isUser = message.role === 'user';
    
    return (
      <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-2`}>
        <div className={`flex items-start gap-2 max-w-[80%] ${isUser ? 'flex-row-reverse' : ''}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center 
            ${isUser ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
            {isUser ? <User size={16} /> : <BotIcon size={16} className="" />}
          </div>
          <div className={`p-3 rounded-lg ${isUser ? 
            'bg-primary text-primary-foreground rounded-tr-none' : 
            'bg-secondary text-secondary-foreground rounded-tl-none'}`}>
            {message.content}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="w-full h-[600px] max-h-[80vh] flex flex-col">
      <CardHeader className="px-4 py-2 border-b">
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText size={20} />
          Course Designer AI
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-grow overflow-y-auto p-4">
        <div className="space-y-4">
          {messages.map((message: Message) => (
            <div key={message.id} className="chat-message">
              {renderMessage(message)}
            </div>
          ))}
          {(isLoading || isFetchingEmployeeData) && (
            <div className="flex justify-center items-center py-2">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}
          <div ref={endOfMessagesRef} />
        </div>
      </CardContent>
      
      <CardFooter className="p-3 border-t">
        <div className="flex w-full items-center gap-2">
          <Input
            value={input}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type your message..."
            disabled={isLoading}
            className="flex-grow"
          />
          <Button 
            onClick={() => handleSendMessage()} 
            disabled={isLoading || !input.trim()} 
            size="icon"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendIcon className="h-4 w-4" />}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
} 