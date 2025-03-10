import { Metadata } from "next";
import { notFound } from "next/navigation";
import { CourseService } from "@/services/course-service";
import { CourseDetails } from "@/components/courses/CourseDetails";

type CoursePageProps = {
  params: {
    id: string;
  };
};

export async function generateMetadata(
  { params }: CoursePageProps
): Promise<Metadata> {
  // Fetch the course
  try {
    const courseService = CourseService.getInstance();
    const course = await courseService.getCourseById(params.id);
    
    if (!course) {
      return {
        title: "Course Not Found | Learnfinity",
        description: "The requested course could not be found",
      };
    }
    
    return {
      title: `${course.title} | Learnfinity`,
      description: course.description.substring(0, 160),
    };
  } catch (error) {
    console.error("Error generating metadata:", error);
    return {
      title: "Course | Learnfinity",
      description: "View course details",
    };
  }
}

export default async function CoursePage({ params }: CoursePageProps) {
  try {
    const courseService = CourseService.getInstance();
    const course = await courseService.getCourseById(params.id);
    
    if (!course) {
      notFound();
    }
    
    return (
      <div className="container mx-auto px-4 py-8">
        <CourseDetails course={course} />
      </div>
    );
  } catch (error) {
    console.error("Error loading course:", error);
    notFound();
  }
} 