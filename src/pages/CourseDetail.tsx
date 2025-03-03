import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { Check, Clock, Video, File, Award, ArrowLeft, Play, LucideIcon } from 'lucide-react';
import { useCoursesData } from '@/hooks/useCoursesData';
import { useLearningData } from '@/hooks/useLearningData';
import { formatDuration, calculateProgress } from '@/lib/utils';
import { AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, 
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialog, AlertDialogAction } from '@/components/ui/alert-dialog';

// Types
interface Module {
  id: string;
  title: string;
  description: string;
  order_number: number;
  lessons: Lesson[];
}

interface Lesson {
  id: string;
  title: string;
  description: string;
  content_type: 'video' | 'document' | 'quiz';
  content_url: string;
  duration: number;
  order_number: number;
  is_completed?: boolean;
}

interface Course {
  id: string;
  title: string;
  description: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  category: string;
  duration: number;
  thumbnail_url: string;
  created_at: string;
  updated_at: string;
  modules: Module[];
}

// Header Component
const CourseHeader = ({ course, onBack }: { course: Course; onBack: () => void }) => (
  <div className="flex flex-col space-y-4 px-4 md:px-8 py-6 bg-card rounded-lg shadow-sm mb-6">
    <div className="flex items-center gap-2 mb-2">
      <Button variant="ghost" size="icon" onClick={onBack}>
        <ArrowLeft className="h-4 w-4" />
      </Button>
      <Badge variant="outline" className="ml-2">{course.category}</Badge>
      <Badge variant="secondary">{course.level}</Badge>
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="col-span-1 lg:col-span-2">
        <h1 className="text-2xl md:text-3xl font-bold">{course.title}</h1>
        <p className="mt-2 text-muted-foreground">{course.description}</p>
      </div>
      <div className="col-span-1 flex flex-col justify-end gap-2">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {formatDuration(course.duration)}
          </span>
        </div>
      </div>
    </div>
  </div>
);

// Enrollment Section Component
const EnrollmentSection = ({ 
  course, 
  isEnrolled, 
  isLoading, 
  onEnroll 
}: { 
  course: Course; 
  isEnrolled: boolean; 
  isLoading: boolean; 
  onEnroll: () => void 
}) => (
  <Card className="mb-6">
    <CardHeader>
import React, { useState } from "react";
import { useParams } from "react-router-dom";
import {
  BarChart2,
  BookOpen,
  Clock,
  Users,
  PlayCircle,
  FileText,
  Star,
  ChevronDown,
  ChevronUp,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import DashboardLayout from "@/components/DashboardLayout";
import { useToast } from "@/hooks/use-toast";

// Mock course data
const courseData = {
  id: "1",
  title: "Introduction to Web Development",
  description:
    "Learn the fundamentals of web development including HTML, CSS, and JavaScript. This course is designed for beginners and will teach you everything you need to know to build your first website.",
  longDescription:
    "This comprehensive course will take you from having no knowledge about web development to being able to create fully functional websites using the latest technologies and best practices. You'll learn how the web works, how to structure content with HTML, how to style your pages with CSS, and how to add interactivity with JavaScript. By the end of this course, you'll have the skills to build responsive websites and the knowledge to continue learning more advanced web development concepts.",
  level: "Beginner",
  category: "Web Development",
  tags: ["HTML", "CSS", "JavaScript", "Responsive Design"],
  duration: "12 hours",
  enrolled: 1532,
  rating: 4.8,
  reviews: 342,
  instructor: {
    name: "Sarah Johnson",
    bio: "Frontend Developer with 8 years of experience teaching web technologies.",
    avatar: "https://api.dicebear.com/7.x/personas/svg?seed=sarah",
  },
  updatedAt: "2023-08-15",
  image: "https://images.unsplash.com/photo-1593720219276-0b1eacd0aef4?q=80&w=2061&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  progress: 35,
  chapters: [
    {
      id: "chapter1",
      title: "Introduction to Web Development",
      description: "Overview of web development and course structure",
      duration: "25 minutes",
      completed: true,
      lessons: [
        {
          id: "lesson1",
          title: "What is Web Development?",
          duration: "10 minutes",
          type: "video",
          completed: true,
        },
        {
          id: "lesson2",
          title: "The Web Development Ecosystem",
          duration: "8 minutes",
          type: "video",
          completed: true,
        },
        {
          id: "lesson3",
          title: "Setting Up Your Development Environment",
          duration: "7 minutes",
          type: "video",
          completed: true,
        },
      ],
    },
    {
      id: "chapter2",
      title: "HTML Fundamentals",
      description: "Learn the basics of HTML and document structure",
      duration: "1 hour 15 minutes",
      completed: true,
      lessons: [
        {
          id: "lesson4",
          title: "HTML Document Structure",
          duration: "12 minutes",
          type: "video",
          completed: true,
        },
        {
          id: "lesson5",
          title: "Working with Text Elements",
          duration: "15 minutes",
          type: "video",
          completed: true,
        },
        {
          id: "lesson6",
          title: "Links and Images",
          duration: "18 minutes",
          type: "video",
          completed: true,
        },
        {
          id: "lesson7",
          title: "Creating Forms",
          duration: "20 minutes",
          type: "video",
          completed: true,
        },
        {
          id: "lesson8",
          title: "HTML Practice Exercise",
          duration: "10 minutes",
          type: "exercise",
          completed: true,
        },
      ],
    },
    {
      id: "chapter3",
      title: "CSS Basics",
      description: "Learn how to style your HTML with CSS",
      duration: "2 hours",
      completed: false,
      lessons: [
        {
          id: "lesson9",
          title: "Introduction to CSS",
          duration: "15 minutes",
          type: "video",
          completed: true,
        },
        {
          id: "lesson10",
          title: "Selectors and Properties",
          duration: "20 minutes",
          type: "video",
          completed: true,
        },
        {
          id: "lesson11",
          title: "Box Model Explained",
          duration: "25 minutes",
          type: "video",
          completed: true,
        },
        {
          id: "lesson12",
          title: "Layout with CSS",
          duration: "30 minutes",
          type: "video",
          completed: false,
        },
        {
          id: "lesson13",
          title: "CSS Flexbox",
          duration: "20 minutes",
          type: "video",
          completed: false,
        },
        {
          id: "lesson14",
          title: "CSS Grid",
          duration: "10 minutes",
          type: "video",
          completed: false,
        },
      ],
    },
    {
      id: "chapter4",
      title: "Introduction to JavaScript",
      description: "Learn the basics of JavaScript programming",
      duration: "3 hours",
      completed: false,
      lessons: [
        {
          id: "lesson15",
          title: "JavaScript Basics",
          duration: "20 minutes",
          type: "video",
          completed: false,
        },
        {
          id: "lesson16",
          title: "Variables and Data Types",
          duration: "25 minutes",
          type: "video",
          completed: false,
        },
        {
          id: "lesson17",
          title: "Control Flow: Conditionals",
          duration: "20 minutes",
          type: "video",
          completed: false,
        },
        {
          id: "lesson18",
          title: "Control Flow: Loops",
          duration: "20 minutes",
          type: "video",
          completed: false,
        },
        {
          id: "lesson19",
          title: "Functions",
          duration: "25 minutes",
          type: "video",
          completed: false,
        },
        {
          id: "lesson20",
          title: "DOM Manipulation",
          duration: "30 minutes",
          type: "video",
          completed: false,
        },
        {
          id: "lesson21",
          title: "Event Handling",
          duration: "20 minutes",
          type: "video",
          completed: false,
        },
        {
          id: "lesson22",
          title: "JavaScript Coding Challenge",
          duration: "20 minutes",
          type: "exercise",
          completed: false,
        },
      ],
    },
    {
      id: "chapter5",
      title: "Building a Complete Website",
      description: "Put everything together to build your first website",
      duration: "5 hours",
      completed: false,
      lessons: [
        {
          id: "lesson23",
          title: "Project Overview",
          duration: "15 minutes",
          type: "video",
          completed: false,
        },
        {
          id: "lesson24",
          title: "Planning Your Website",
          duration: "20 minutes",
          type: "video",
          completed: false,
        },
        {
          id: "lesson25",
          title: "Building the HTML Structure",
          duration: "45 minutes",
          type: "video",
          completed: false,
        },
        {
          id: "lesson26",
          title: "Styling with CSS",
          duration: "50 minutes",
          type: "video",
          completed: false,
        },
        {
          id: "lesson27",
          title: "Adding Interactivity with JavaScript",
          duration: "60 minutes",
          type: "video",
          completed: false,
        },
        {
          id: "lesson28",
          title: "Making Your Website Responsive",
          duration: "45 minutes",
          type: "video",
          completed: false,
        },
        {
          id: "lesson29",
          title: "Testing and Debugging",
          duration: "30 minutes",
          type: "video",
          completed: false,
        },
        {
          id: "lesson30",
          title: "Publishing Your Website",
          duration: "25 minutes",
          type: "video",
          completed: false,
        },
      ],
    },
  ],
  whatYouWillLearn: [
    "Build websites using HTML, CSS, and JavaScript",
    "Understand how the web works and how websites are served",
    "Create responsive layouts that work on any device",
    "Add interactivity to websites with JavaScript",
    "Debug common web development issues",
    "Deploy your website to a live server",
  ],
  requirements: [
    "A computer with internet connection",
    "No prior programming experience required",
    "Basic computer skills",
  ],
};

const CourseDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [activeLesson, setActiveLesson] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string[]>([]);

  // Calculate total progress
  const totalLessons = courseData.chapters.reduce(
    (sum, chapter) => sum + chapter.lessons.length,
    0
  );
  const completedLessons = courseData.chapters.reduce(
    (sum, chapter) =>
      sum + chapter.lessons.filter((lesson) => lesson.completed).length,
    0
  );
  const progressPercent = Math.round((completedLessons / totalLessons) * 100);

  const toggleExpand = (chapterId: string) => {
    setExpanded((prev) =>
      prev.includes(chapterId)
        ? prev.filter((id) => id !== chapterId)
        : [...prev, chapterId]
    );
  };

  const handleStartLesson = (lessonId: string) => {
    setActiveLesson(lessonId);
    toast({
      title: "Lesson started",
      description: "You've started a new lesson. Good luck with your learning!",
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Column - Course Info */}
          <div className="w-full lg:w-3/5 space-y-6">
            <div className="space-y-4">
              <div className="relative aspect-video overflow-hidden rounded-xl">
                <img
                  src={courseData.image}
                  alt={courseData.title}
                  className="object-cover w-full h-full"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <Button
                    size="lg"
                    className="rounded-full w-16 h-16 flex items-center justify-center"
                    onClick={() => handleStartLesson(courseData.chapters[0].lessons[0].id)}
                  >
                    <PlayCircle className="h-10 w-10" />
                  </Button>
                </div>
              </div>

              <div>
                <div className="flex flex-wrap gap-2 mb-2">
                  <Badge>{courseData.category}</Badge>
                  {courseData.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <h1 className="text-3xl font-bold">{courseData.title}</h1>
                <p className="text-muted-foreground mt-2">
                  {courseData.longDescription}
                </p>
              </div>

              <div className="flex flex-wrap gap-6">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <span>{courseData.duration}</span>
                </div>
                <div className="flex items-center gap-2">
                  <BarChart2 className="h-5 w-5 text-muted-foreground" />
                  <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                    {courseData.level}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <span>{courseData.enrolled.toLocaleString()} enrolled</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-amber-500" />
                  <span>
                    {courseData.rating} ({courseData.reviews} reviews)
                  </span>
                </div>
              </div>
            </div>

            <Tabs defaultValue="content">
              <TabsList className="mb-4">
                <TabsTrigger value="content">Course Content</TabsTrigger>
                <TabsTrigger value="info">What You'll Learn</TabsTrigger>
                <TabsTrigger value="instructor">Instructor</TabsTrigger>
              </TabsList>

              <TabsContent value="content" className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-medium">Course Content</h3>
                    <p className="text-sm text-muted-foreground">
                      {courseData.chapters.length} chapters • {totalLessons}{" "}
                      lessons • {courseData.duration} total
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Expand All
                  </Button>
                </div>

                <div className="space-y-2 border rounded-lg overflow-hidden">
                  {courseData.chapters.map((chapter) => (
                    <div key={chapter.id} className="border-b last:border-b-0">
                      <div
                        className={`px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-muted/50 ${
                          expanded.includes(chapter.id) ? "bg-muted/50" : ""
                        }`}
                        onClick={() => toggleExpand(chapter.id)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-1">
                            {chapter.completed ? (
                              <div className="h-5 w-5 rounded-full bg-green-500 flex items-center justify-center">
                                <Check className="h-3 w-3 text-white" />
                              </div>
                            ) : (
                              <div className="h-5 w-5 rounded-full border-2 border-muted-foreground" />
                            )}
                          </div>
                          <div>
                            <h4 className="font-medium">{chapter.title}</h4>
                            <p className="text-sm text-muted-foreground">
                              {chapter.description} • {chapter.duration}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-muted-foreground">
                            {
                              chapter.lessons.filter(
                                (lesson) => lesson.completed
                              ).length
                            }{" "}
                            / {chapter.lessons.length}
                          </span>
                          {expanded.includes(chapter.id) ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </div>
                      </div>

                      {expanded.includes(chapter.id) && (
                        <div className="bg-muted/20 border-t">
                          {chapter.lessons.map((lesson) => (
                            <div
                              key={lesson.id}
                              className={`px-4 py-3 pl-12 flex items-center justify-between hover:bg-muted/30 cursor-pointer ${
                                activeLesson === lesson.id
                                  ? "bg-primary/10"
                                  : ""
                              }`}
                              onClick={() => handleStartLesson(lesson.id)}
                            >
                              <div className="flex items-start gap-3">
                                <div className="mt-1">
                                  {lesson.completed ? (
                                    <div className="h-5 w-5 rounded-full bg-green-500 flex items-center justify-center">
                                      <Check className="h-3 w-3 text-white" />
                                    </div>
                                  ) : (
                                    <div className="h-5 w-5 rounded-full border-2 border-muted-foreground" />
                                  )}
                                </div>
                                <div>
                                  <h5 className="font-medium">
                                    {lesson.title}
                                  </h5>
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    {lesson.type === "video" ? (
                                      <PlayCircle className="h-3 w-3" />
                                    ) : (
                                      <FileText className="h-3 w-3" />
                                    )}
                                    <span>
                                      {lesson.type} • {lesson.duration}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="opacity-0 group-hover:opacity-100"
                              >
                                {activeLesson === lesson.id
                                  ? "Continue"
                                  : "Start"}
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="info" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>What You'll Learn</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {courseData.whatYouWillLearn.map((item, index) => (
                        <li
                          key={index}
                          className="flex items-start gap-2 text-sm"
                        >
                          <Check className="h-4 w-4 text-green-500 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Requirements</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {courseData.requirements.map((item, index) => (
                        <li
                          key={index}
                          className="flex items-start gap-2 text-sm"
                        >
                          <div className="h-1.5 w-1.5 rounded-full bg-foreground mt-1.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="instructor">
                <Card>
                  <CardHeader>
                    <CardTitle>Instructor</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-start gap-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage
                          src={courseData.instructor.avatar}
                          alt={courseData.instructor.name}
                        />
                        <AvatarFallback>
                          {courseData.instructor.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="text-lg font-medium">
                          {courseData.instructor.name}
                        </h3>
                        <p className="text-muted-foreground">
                          {courseData.instructor.bio}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column - Course Progress and Actions */}
          <div className="w-full lg:w-2/5 space-y-6">
            <Card className="sticky top-6">
              <CardContent className="pt-6 space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <h3 className="font-medium">Your Progress</h3>
                    <span className="text-sm">{progressPercent}% complete</span>
                  </div>
                  <Progress value={progressPercent} className="h-3" />
                  <p className="text-sm text-muted-foreground">
                    {completedLessons} of {totalLessons} lessons completed
                  </p>
                </div>

                <Button
                  size="lg"
                  className="w-full"
                  onClick={() =>
                    handleStartLesson(
                      // Find the first incomplete lesson
                      courseData.chapters
                        .find((chapter) =>
                          chapter.lessons.some(
                            (lesson) => !lesson.completed
                          )
                        )
                        ?.lessons.find((lesson) => !lesson.completed)?.id ||
                        courseData.chapters[0].lessons[0].id
                    )
                  }
                >
                  {progressPercent > 0 ? "Continue Learning" : "Start Course"}
                </Button>

                <div className="flex items-center justify-between py-4 border-t">
                  <span className="font-medium">Course Information</span>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <BookOpen className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Chapters</p>
                      <p className="text-sm text-muted-foreground">
                        {courseData.chapters.length} chapters
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Lessons</p>
                      <p className="text-sm text-muted-foreground">
                        {totalLessons} lessons
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Duration</p>
                      <p className="text-sm text-muted-foreground">
                        {courseData.duration} total
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Enrolled</p>
                      <p className="text-sm text-muted-foreground">
                        {courseData.enrolled.toLocaleString()} students
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Star className="h-5 w-5 text-amber-500" />
                    <div>
                      <p className="text-sm font-medium">Rating</p>
                      <p className="text-sm text-muted-foreground">
                        {courseData.rating} ({courseData.reviews} reviews)
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Last updated: {courseData.updatedAt}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CourseDetail;
