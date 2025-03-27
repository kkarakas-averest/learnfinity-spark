import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import LearningPathCard from "@/components/LearningPathCard";

// Mock data
const mockLearningPaths = [
  {
    id: "1",
    title: "Full-Stack Developer Path",
    description: "Comprehensive curriculum to become a professional full-stack developer.",
    courseCount: 8,
    estimatedTime: "120 hours",
    progress: 42,
    recommended: true,
    tags: ["Web Development", "JavaScript", "React", "Node.js"],
  },
  {
    id: "2",
    title: "Data Science Career Path",
    description: "From statistics fundamentals to advanced machine learning models.",
    courseCount: 12,
    estimatedTime: "160 hours",
    progress: 28,
    recommended: false,
    tags: ["Data Science", "Python", "ML", "Statistics"],
  },
];

const LearningPathsSection = () => {
  return (
    <section className="animate-fade-in opacity-0" style={{ animationDelay: "1000ms", animationFillMode: "forwards" }}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Your Learning Paths</h2>
        <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground" asChild>
          <a href="/learning-paths">
            View all
            <ChevronRight size={16} />
          </a>
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {mockLearningPaths.map((path) => (
          <LearningPathCard key={path.id} {...path} />
        ))}
      </div>
    </section>
  );
};

export default LearningPathsSection;
