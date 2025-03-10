import { Metadata } from "next";
import { CourseList } from "@/components/courses/CourseList";
import { CourseHeader } from "@/components/courses/CourseHeader";

export const metadata: Metadata = {
  title: "Courses | Learnfinity",
  description: "Browse all available courses",
};

export default async function CoursesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <CourseHeader 
        title="Courses"
        description="Browse all available courses and learning paths"
      />
      <CourseList />
    </div>
  );
} 