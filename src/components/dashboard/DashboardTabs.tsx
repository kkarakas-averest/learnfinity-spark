
import { useState } from "react";
import { 
  LayoutDashboard, 
  BookOpen, 
  Library,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DashboardStats from "./DashboardStats";
import ContinueLearningSection from "./ContinueLearningSection";
import LearningPathsSection from "./LearningPathsSection";
import CourseCard from "@/components/CourseCard";
import LearningPathCard from "@/components/LearningPathCard";

// Mock data for the courses tab
const mockAllCourses = [
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
  {
    id: "3",
    title: "Python for Data Analysis",
    description: "Use Python libraries for data manipulation and visualization.",
    category: "Data Science",
    duration: "10 hours",
    level: "Intermediate" as const,
    enrolled: 2800,
    image: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=1600&auto=format&fit=crop",
    progress: 100,
  },
  {
    id: "4",
    title: "UX Design Principles",
    description: "Learn fundamental UX design principles and methodologies.",
    category: "Design",
    duration: "6 hours",
    level: "Beginner" as const,
    enrolled: 1900,
    image: "https://images.unsplash.com/photo-1633356122102-3fe601e05bd2?q=80&w=1600&auto=format&fit=crop",
    progress: 100,
  },
];

// Mock data for the paths tab
const mockAllLearningPaths = [
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
  {
    id: "3",
    title: "UI/UX Design Mastery",
    description: "Learn user interface and experience design from scratch to advanced concepts.",
    courseCount: 6,
    estimatedTime: "80 hours",
    progress: 42,
    recommended: true,
    tags: ["Design", "Figma", "User Research"],
  },
  {
    id: "4",
    title: "Cloud Computing Specialist",
    description: "Master AWS, Azure, and GCP for modern cloud infrastructure.",
    courseCount: 10,
    estimatedTime: "140 hours",
    progress: 28,
    recommended: false,
    tags: ["Cloud", "DevOps", "Infrastructure"],
  },
];

const DashboardTabs = () => {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
      <TabsList className="bg-white border shadow-sm animate-fade-in opacity-0" style={{ animationDelay: "300ms", animationFillMode: "forwards" }}>
        <TabsTrigger value="overview" className="gap-1.5 data-[state=active]:shadow-sm">
          <LayoutDashboard size={16} />
          <span>Overview</span>
        </TabsTrigger>
        <TabsTrigger value="courses" className="gap-1.5 data-[state=active]:shadow-sm">
          <BookOpen size={16} />
          <span>My Courses</span>
        </TabsTrigger>
        <TabsTrigger value="paths" className="gap-1.5 data-[state=active]:shadow-sm">
          <Library size={16} />
          <span>Learning Paths</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-8 animate-fade-in">
        <DashboardStats />
        <ContinueLearningSection />
        <LearningPathsSection />
      </TabsContent>

      <TabsContent value="courses" className="animate-fade-in">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockAllCourses.map((course, index) => (
            <CourseCard 
              key={`${course.id}-${index}`} 
              {...course} 
              progress={index > 1 ? 100 : course.progress} 
            />
          ))}
        </div>
      </TabsContent>

      <TabsContent value="paths" className="animate-fade-in">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {mockAllLearningPaths.map((path, index) => (
            <LearningPathCard 
              key={`${path.id}-${index}`} 
              {...path} 
              recommended={index === 1} 
            />
          ))}
        </div>
      </TabsContent>
    </Tabs>
  );
};

export default DashboardTabs;
