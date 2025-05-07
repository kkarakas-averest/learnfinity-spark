import React, { useState, useEffect } from '@/lib/react-helpers';
import { motion } from 'framer-motion';
import { 
  UserPlus, 
  Upload, 
  BookOpen,
  ChevronRight,
  CheckCircle,
  ArrowRight,
  BarChart2,
  FileText,
  Settings
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { hrServices } from '@/services/hrServices';
import { useNavigate } from 'react-router-dom';

interface StepMetrics {
  employeeCount: number;
  resumeCount: number;
  positionsWithRequirements: number;
  skillTaxonomyCount: number;
  normalizedSkillsCount: number;
  generatedCoursesCount: number;
}

interface RoadmapStep {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  metrics?: string;
  detailText?: string;
  actionText?: string;
  actionPath?: string;
}

const HRProcessRoadmap: React.FC = () => {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<StepMetrics>({
    employeeCount: 0,
    resumeCount: 0,
    positionsWithRequirements: 0,
    skillTaxonomyCount: 0,
    normalizedSkillsCount: 0,
    generatedCoursesCount: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setIsLoading(true);
        
        // Fetch real data from services instead of using mock data
        const dashboardData = await hrServices.getDashboardMetrics();
        
        if (dashboardData && dashboardData.success) {
          const data = dashboardData.metrics;
          
          setMetrics({
            employeeCount: data.activeEmployees || 0,
            resumeCount: data.resumeCount || 0,
            positionsWithRequirements: data.positionsWithRequirements || 0,
            skillTaxonomyCount: data.skillTaxonomyCount || 0,
            normalizedSkillsCount: data.normalizedSkillsCount || 0,
            generatedCoursesCount: data.generatedCoursesCount || 0
          });
        }
      } catch (error) {
        console.error('Error fetching roadmap metrics:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMetrics();
  }, []);

  const roadmapSteps: RoadmapStep[] = [
    {
      id: 1,
      title: "Employee Creation",
      description: "Add employees individually or in bulk to the system",
      icon: <UserPlus className="h-8 w-8 text-blue-500" />,
      metrics: `${metrics.employeeCount} employees in the system`,
      detailText: "Employees can be added one by one or imported in bulk via CSV",
      actionText: "Add Employees",
      actionPath: "/hr-dashboard/employees/new"
    },
    {
      id: 2,
      title: "Resume Upload",
      description: "Upload employee resumes for skills extraction",
      icon: <Upload className="h-8 w-8 text-green-500" />,
      metrics: `${metrics.resumeCount} resumes processed`,
      detailText: "Resume parsing extracts skills, experience and education information"
    },
    {
      id: 3,
      title: "Position & Skill Requirements",
      description: "Define position requirements manually or with AI assistance",
      icon: <FileText className="h-8 w-8 text-purple-500" />,
      metrics: `${metrics.positionsWithRequirements} positions with defined requirements`,
      detailText: "AI helps suggest appropriate skills needed for each position",
      actionText: "Manage Positions",
      actionPath: "/hr-dashboard/positions/requirements"
    },
    {
      id: 4,
      title: "Skills Taxonomy",
      description: "Comprehensive skill database classification",
      icon: <FileText className="h-8 w-8 text-indigo-500" />,
      metrics: `${metrics.skillTaxonomyCount} skills in taxonomy database`,
      detailText: "Our system uses a standardized skills taxonomy for accurate matching"
    },
    {
      id: 5,
      title: "Skill Normalization",
      description: "Resume skills + taxonomy skills matched with position requirements",
      icon: <Settings className="h-8 w-8 text-amber-500" />,
      metrics: `${metrics.normalizedSkillsCount} skills normalized`,
      detailText: "Skills from resumes are mapped to our taxonomy while preserving original context"
    },
    {
      id: 6,
      title: "Skills Gap Analysis",
      description: "Identify missing skills based on position requirements",
      icon: <BarChart2 className="h-8 w-8 text-rose-500" />,
      detailText: "Automated analysis identifies gaps between employee skills and role requirements",
      actionText: "View Skills Gaps",
      actionPath: "/hr-dashboard/skills-inventory"
    },
    {
      id: 7,
      title: "Course Generation",
      description: "AI generates personalized learning paths for skill development",
      icon: <BookOpen className="h-8 w-8 text-cyan-500" />,
      metrics: `${metrics.generatedCoursesCount} courses generated`,
      detailText: "Groq API LLM creates custom learning content to address skill gaps",
      actionText: "Generate Courses",
      actionPath: "/hr-dashboard/course-generator"
    }
  ];

  // Animation variants for framer-motion
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { type: "spring", stiffness: 100 }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">HR Workflow Roadmap</h2>
          <p className="text-muted-foreground">Complete end-to-end process for employee skills management</p>
        </div>
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 px-3 py-1.5">
          <Settings className="h-4 w-4 mr-1" />
          Real-time data
        </Badge>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : (
        <motion.div 
          className="space-y-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {roadmapSteps.map((step, index) => (
            <motion.div key={step.id} variants={itemVariants}>
              <Card className="overflow-hidden border-l-4" style={{ borderLeftColor: getStepColor(step.id) }}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-md" style={{ backgroundColor: getStepColorBg(step.id) }}>
                        {step.icon}
                      </div>
                      <div>
                        <CardTitle className="text-lg flex items-center">
                          {step.title}
                          <Badge className="ml-2" variant="outline">Step {step.id}</Badge>
                        </CardTitle>
                        <CardDescription>{step.description}</CardDescription>
                      </div>
                    </div>
                    {step.metrics && (
                      <Badge className="h-fit py-1 px-3" variant="secondary">
                        {step.metrics}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground mt-1">{step.detailText}</div>
                  
                  {index < roadmapSteps.length - 1 && (
                    <div className="mt-4 flex items-center">
                      <div className="flex-1">
                        <Progress value={(metrics.employeeCount > 0 ? 100 : 30)} className="h-1" />
                      </div>
                      <div className="ml-2">
                        <ArrowRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </div>
                  )}
                </CardContent>
                
                {step.actionText && step.actionPath && (
                  <CardFooter className="pt-0">
                    <Button 
                      variant="outline" 
                      className="text-xs"
                      onClick={() => navigate(step.actionPath || '')}
                    >
                      {step.actionText}
                      <ChevronRight className="h-3 w-3 ml-1" />
                    </Button>
                  </CardFooter>
                )}
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
};

// Helper functions for color styling
function getStepColor(stepId: number): string {
  const colors = [
    '#3b82f6', // blue-500
    '#10b981', // green-500
    '#8b5cf6', // violet-500
    '#6366f1', // indigo-500
    '#f59e0b', // amber-500
    '#ef4444', // red-500
    '#06b6d4'  // cyan-500
  ];
  
  return colors[(stepId - 1) % colors.length];
}

function getStepColorBg(stepId: number): string {
  const colors = [
    'rgba(59, 130, 246, 0.1)', // blue-500 bg
    'rgba(16, 185, 129, 0.1)', // green-500 bg
    'rgba(139, 92, 246, 0.1)', // violet-500 bg
    'rgba(99, 102, 241, 0.1)', // indigo-500 bg
    'rgba(245, 158, 11, 0.1)', // amber-500 bg
    'rgba(239, 68, 68, 0.1)',  // red-500 bg
    'rgba(6, 182, 212, 0.1)'   // cyan-500 bg
  ];
  
  return colors[(stepId - 1) % colors.length];
}

export default HRProcessRoadmap; 