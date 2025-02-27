
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import CourseCard from "@/components/CourseCard";

// Mock data
const mockActiveCourses = [
  {
    id: "1",
    title: "Introduction to Machine Learning",
    description: "Learn the fundamentals of machine learning algorithms and applications.",
    category: "Data Science",
    duration: "8 hours",
    level: "Beginner" as const,
    enrolled: 4500,
    image: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=1600&auto=format&fit=crop",
    progress: 65,
  },
  {
    id: "2",
    title: "Advanced React Development",
    description: "Master advanced concepts in React including hooks, context, and Redux.",
    category: "Web Development",
    duration: "12 hours",
    level: "Intermediate" as const,
    enrolled: 3200,
    image: "https://images.unsplash.com/photo-1633356122102-3fe601e05bd2?q=80&w=1600&auto=format&fit=crop",
    progress: 30,
  },
];

const ContinueLearningSection = () => {
  return (
    <section className="animate-fade-in opacity-0" style={{ animationDelay: "800ms", animationFillMode: "forwards" }}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Continue Learning</h2>
        <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground" asChild>
          <a href="/courses">
            View all
            <ChevronRight size={16} />
          </a>
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {mockActiveCourses.map((course) => (
          <CourseCard key={course.id} {...course} />
        ))}
      </div>
    </section>
  );
};

export default ContinueLearningSection;
