
"use client";

import React, { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Clock, Award, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ModuleList } from "./ModuleList";
import { QuizList } from "./QuizList";
import { ResourceList } from "./ResourceList";
import { PersonalizedContentView } from "./PersonalizedContentView";
import { PersonalizedContentService } from "@/services/personalized-content-service";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { AICourseContent, AICourseContentSection } from "@/lib/types/content";

interface CourseDetails {
  id: string;
  title: string;
  description: string;
  targetAudience: string;
  estimatedDuration: string;
  learningObjectives: string[];
  modules: Module[];
  quizzes: Quiz[];
  resources: Resource[];
  status: string;
  isPublished: boolean;
  createdAt: string;
  createdBy: string;
}

interface Module {
  id: string;
  title: string;
  description: string;
  content: string;
  topics: string[];
  orderIndex: number;
}

interface Quiz {
  id: string;
  title: string;
  description: string;
  questions: Question[];
}

interface Question {
  id: string;
  questionText: string;
  options: string[];
  correctAnswer: number | string;
  explanation?: string;
}

interface Resource {
  id: string;
  title: string;
  type: string;
  url: string;
  description: string;
}

interface CourseDetailsProps {
  course: CourseDetails;
}

export function CourseDetails({ course }: CourseDetailsProps) {
  const [activeTab, setActiveTab] = useState("modules");
  const [personalizedContent, setPersonalizedContent] = useState<AICourseContent | null>(null);
  const [personalizedSections, setPersonalizedSections] = useState<AICourseContentSection[]>([]);
  const [isLoadingPersonalized, setIsLoadingPersonalized] = useState(false);
  const [hasPersonalized, setHasPersonalized] = useState(false);
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchPersonalizedContent = async () => {
      try {
        setIsLoadingPersonalized(true);
        // Get the current user
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user) {
          console.log("No user session");
          return;
        }
        
        const userId = session.user.id;
        const contentService = PersonalizedContentService.getInstance();
        
        // Get employee ID
        const { data: employee, error: employeeError } = await supabase
          .from('hr_employees')
          .select('id')
          .eq('user_id', userId)
          .single();
          
        if (employeeError && employeeError.code !== 'PGRST116') {
          console.error('Error fetching employee:', employeeError);
        } else if (employee) {
          setEmployeeId(employee.id);
        } else {
          setEmployeeId(userId); // Fallback to user ID
        }
        
        // Check if personalized content exists
        const hasContent = await contentService.hasPersonalizedContent(course.id, userId);
        setHasPersonalized(hasContent);
        
        if (hasContent) {
          // If content exists, fetch it
          const { content, sections } = await contentService.getPersonalizedContent(course.id, userId);
          setPersonalizedContent(content);
          setPersonalizedSections(sections);
          
          // Switch to personalized content tab if content exists
          setActiveTab("personalized");
        }
      } catch (error) {
        console.error("Error fetching personalized content:", error);
        toast({
          title: "Error",
          description: "Failed to load personalized content",
          variant: "destructive",
        });
      } finally {
        setIsLoadingPersonalized(false);
      }
    };

    fetchPersonalizedContent();
  }, [course.id, toast]);

  // Function to generate personalized content
  const generatePersonalizedContent = async () => {
    if (!employeeId || !course.id) {
      toast({
        title: "Cannot Generate Content",
        description: "Missing required information for personalization",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const response = await fetch('/api/hr/courses/enhance-course-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          courseId: course.id,
          employeeId,
          modules: 3,
          sectionsPerModule: 3,
          includeQuiz: true
        })
      });
      
      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}: ${await response.text()}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to generate personalized content');
      }

      toast({
        title: "Content Generation Started",
        description: "Personalized content is being generated for you. This may take a few minutes.",
        variant: "default"
      });
      
      setActiveTab("personalized");
      
    } catch (error: any) {
      console.error('Error generating personalized content:', error);
      toast({
        title: "Error Generating Content",
        description: error.message || "An error occurred while generating personalized content",
        variant: "destructive"
      });
      throw error;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header section */}
      <div className="flex flex-col space-y-4 md:flex-row md:justify-between md:space-y-0">
        <div>
          <div className="flex items-center space-x-4">
            <Link href="/courses" passHref>
              <Button variant="ghost" size="sm" className="p-0">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to courses
              </Button>
            </Link>
            <Badge className={course.isPublished ? "bg-green-500" : "bg-yellow-500"}>
              {course.status}
            </Badge>
            {hasPersonalized && (
              <Badge className="bg-blue-500">Personalized</Badge>
            )}
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight">{course.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-4">
            <div className="flex items-center text-sm text-muted-foreground">
              <Clock className="mr-2 h-4 w-4" />
              <span>{course.estimatedDuration}</span>
            </div>
            <div className="flex items-center text-sm text-muted-foreground">
              <BookOpen className="mr-2 h-4 w-4" />
              <span>For {course.targetAudience}</span>
            </div>
          </div>
        </div>
        <div className="flex justify-start md:justify-end">
          <Button>Start Course</Button>
        </div>
      </div>

      {/* Course overview */}
      <Card>
        <CardHeader>
          <CardTitle>Course Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">{course.description}</p>
          <h3 className="mb-2 font-semibold">Learning Objectives</h3>
          <ul className="ml-6 list-disc space-y-1">
            {course.learningObjectives.map((objective, i) => (
              <li key={i}>{objective}</li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Course content tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className={`grid w-full ${hasPersonalized ? 'grid-cols-4' : 'grid-cols-3'}`}>
          {hasPersonalized && (
            <TabsTrigger value="personalized">Personalized</TabsTrigger>
          )}
          <TabsTrigger value="modules">Modules</TabsTrigger>
          <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
        </TabsList>
        
        {hasPersonalized || isLoadingPersonalized ? (
          <TabsContent value="personalized" className="mt-6">
            <PersonalizedContentView 
              content={personalizedContent}
              sections={personalizedSections}
              isLoading={isLoadingPersonalized}
              courseId={course.id}
              employeeId={employeeId}
              onGenerateContent={generatePersonalizedContent}
            />
          </TabsContent>
        ) : (
          <TabsContent value="personalized" className="mt-6">
            <Card>
              <CardContent className="p-8 text-center">
                <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No personalized content</h3>
                <p className="text-muted-foreground mb-6">
                  This course doesn't have any personalized content generated for you yet.
                </p>
                <Button onClick={generatePersonalizedContent}>Generate Personalized Content</Button>
              </CardContent>
            </Card>
          </TabsContent>
        )}
        
        <TabsContent value="modules" className="mt-6">
          <ModuleList modules={course.modules} />
        </TabsContent>
        
        <TabsContent value="quizzes" className="mt-6">
          <QuizList quizzes={course.quizzes} />
        </TabsContent>
        
        <TabsContent value="resources" className="mt-6">
          <ResourceList resources={course.resources} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
