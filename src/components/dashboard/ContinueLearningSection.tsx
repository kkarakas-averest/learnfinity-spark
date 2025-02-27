
import CourseCard from "@/components/CourseCard";

// Mock data for the single course
const singleCourse = {
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

const ContinueLearningSection = () => {
  return (
    <section className="animate-fade-in opacity-0" style={{ animationDelay: "800ms", animationFillMode: "forwards" }}>
      <div className="mb-4">
        <h2 className="text-xl font-semibold">Your Course</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CourseCard {...singleCourse} />
      </div>
    </section>
  );
};

export default ContinueLearningSection;
