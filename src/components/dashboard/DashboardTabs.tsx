import React from "@/lib/react-helpers";
import { 
  LayoutDashboard, 
  Library
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DashboardStats from "./DashboardStats";
import ContinueLearningSection from "./ContinueLearningSection";
import LearningPathsSection from "./LearningPathsSection";
import LearningPathCard from "@/components/LearningPathCard";

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
  const [activeTab, setActiveTab] = React.useState("overview");

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
      <TabsList className="bg-white border shadow-sm animate-fade-in opacity-0" style={{ animationDelay: "300ms", animationFillMode: "forwards" }}>
        <TabsTrigger value="overview" className="gap-1.5 data-[state=active]:shadow-sm">
          <LayoutDashboard size={16} />
          <span>Overview</span>
        </TabsTrigger>
        <TabsTrigger value="paths" className="gap-1.5 data-[state=active]:shadow-sm">
          <Library size={16} />
          <span>Learning Path</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-8 animate-fade-in">
        <DashboardStats />
        <ContinueLearningSection />
        <LearningPathsSection />
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
