
import React from "@/lib/react-helpers";
import CourseCard from "@/components/CourseCard";
import { useLearningData } from "@/hooks/useLearningData";
import { Skeleton } from "@/components/ui/skeleton";

const ContinueLearningSection = () => {
  const { getActiveCourses, coursesLoading, coursesError } = useLearningData();
  const activeCourses = getActiveCourses();

  // If there's an error, provide a fallback course
  const fallbackCourse = {
    id: "1",
    title: "Introduction to Machine Learning",
    description: "Learn the fundamentals of machine learning algorithms and applications.",
    category: "Data Science",
    duration: "8 hours",
    level: "Beginner" as const,
    enrolled: 4500,
    image: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=1600&auto=format&fit=crop",
    progress: 65,
  };

  return (
    <section className="animate-fade-in opacity-0" style={{ animationDelay: "800ms", animationFillMode: "forwards" }}>
      <div className="mb-4">
        <h2 className="text-xl font-semibold">Your Course</h2>
      </div>
      
      {coursesLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col h-full">
            <div className="relative aspect-video w-full">
              <Skeleton className="h-full w-full" />
            </div>
            <div className="p-6 flex-grow">
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-full mb-4" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
          </div>
        </div>
      ) : coursesError || !activeCourses || activeCourses.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <CourseCard {...fallbackCourse} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {activeCourses.slice(0, 1).map((course) => (
            <CourseCard 
              key={course.id} 
              {...course} 
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default ContinueLearningSection;
