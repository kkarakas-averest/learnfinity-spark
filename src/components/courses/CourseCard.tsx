import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Clock } from "lucide-react";
import Link from "next/link";

interface Course {
  id: string;
  title: string;
  description: string;
  targetAudience: string;
  estimatedDuration: string;
  isPublished: boolean;
  createdAt: string;
  createdBy: string;
}

interface CourseCardProps {
  course: Course;
}

export function CourseCard({ course }: CourseCardProps) {
  // Format the date
  const formattedDate = new Date(course.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl font-bold">{course.title}</CardTitle>
          {course.isPublished ? (
            <Badge className="bg-green-500">Published</Badge>
          ) : (
            <Badge variant="outline">Draft</Badge>
          )}
        </div>
        <CardDescription className="text-sm text-muted-foreground">
          Created on {formattedDate}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-sm mb-4 line-clamp-3">{course.description}</p>
        <div className="flex items-center text-sm text-muted-foreground mb-2">
          <Clock className="h-4 w-4 mr-2" />
          <span>{course.estimatedDuration}</span>
        </div>
        <div className="flex items-center text-sm text-muted-foreground">
          <BookOpen className="h-4 w-4 mr-2" />
          <span>For {course.targetAudience}</span>
        </div>
      </CardContent>
      <CardFooter>
        <Link href={`/courses/${course.id}`} passHref className="w-full">
          <Button variant="default" className="w-full">
            View Course
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
} 