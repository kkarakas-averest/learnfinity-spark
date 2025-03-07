import React from '@/lib/react-helpers';
import { useParams } from 'react-router-dom';
import { Clock, BarChart2, Users, FileText } from "lucide-react";
import NavbarMigrated from "@/components/NavbarMigrated";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// Mock data (replace with actual data fetching)
const mockCourse = {
  id: "1",
  title: "Introduction to Machine Learning",
  description: "Learn the fundamentals of machine learning algorithms and applications.",
  category: "Data Science",
  duration: "8 hours",
  level: "Beginner" as const,
  enrolled: 4500,
  image: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=1600&auto=format&fit=crop",
  content: [
    { title: "Module 1: Introduction", duration: "1 hour" },
    { title: "Module 2: Supervised Learning", duration: "2 hours" },
    { title: "Module 3: Unsupervised Learning", duration: "2 hours" },
    { title: "Module 4: Model Evaluation", duration: "1.5 hours" },
    { title: "Module 5: Case Studies", duration: "1.5 hours" },
  ],
};

const CourseDetail = () => {
  const { courseId } = useParams();
  // In a real app, you would fetch the course data based on courseId
  const course = mockCourse;

  const getLevelColor = (level: string) => {
    switch (level) {
      case "Beginner":
        return "bg-green-100 text-green-800";
      case "Intermediate":
        return "bg-blue-100 text-blue-800";
      case "Advanced":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-secondary/20">
      <NavbarMigrated />

      <main className="flex-1 pt-24 pb-16">
        <div className="container px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Course Overview */}
            <div className="md:col-span-2">
              <div className="relative aspect-video overflow-hidden rounded-xl mb-6">
                <img
                  src={course.image}
                  alt={course.title}
                  className="object-cover w-full h-full"
                />
                <Badge className="absolute top-3 left-3">{course.category}</Badge>
              </div>

              <h1 className="text-3xl font-bold tracking-tight mb-2">
                {course.title}
              </h1>
              <p className="text-muted-foreground mb-4">{course.description}</p>

              <div className="flex flex-wrap gap-3 mb-6">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock size={14} />
                  <span>{course.duration}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <BarChart2 size={14} />
                  <span className={`px-2 py-0.5 rounded-full ${getLevelColor(course.level)}`}>
                    {course.level}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Users size={14} />
                  <span>{course.enrolled.toLocaleString()} enrolled</span>
                </div>
              </div>

              <Button className="w-full md:w-auto">Start Course</Button>
            </div>

            {/* Course Content */}
            <div>
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Course Content</h2>
                  <ul className="space-y-2">
                    {course.content.map((module, index) => (
                      <li key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText size={16} className="text-muted-foreground" />
                          <span>{module.title}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{module.duration}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CourseDetail;
