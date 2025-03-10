"use client";

import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Clock, Award, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ModuleList } from "./ModuleList";
import { QuizList } from "./QuizList";
import { ResourceList } from "./ResourceList";

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
      <Tabs defaultValue="modules">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="modules">Modules</TabsTrigger>
          <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
        </TabsList>
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