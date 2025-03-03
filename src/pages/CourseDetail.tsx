import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { 
  ArrowLeft, 
  Users, 
  BarChart2, 
  Clock, 
  AlertCircle, 
  PlayCircle, 
  Check, 
  FileText, 
  BookOpen, 
  Star, 
  ChevronDown, 
  ChevronUp 
} from "lucide-react";
import Navbar from "@/components/Navbar";
import ProgressIndicator from "@/components/ProgressIndicator";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";

// Mock course data
const mockCourse = {
  id: "1",
  title: "Introduction to Machine Learning",
  description: "Learn the fundamentals of machine learning algorithms and applications. This comprehensive course covers everything from basic statistical concepts to advanced ML techniques. Perfect for beginners and those looking to refresh their knowledge.",
  category: "Data Science",
  duration: "8 hours",
  level: "Beginner" as const,
  enrolled: 4500,
  instructor: "Dr. Sarah Chen",
  rating: 4.8,
  reviews: 342,
  lastUpdated: "March 2023",
  progress: 65,
  image: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=1600&auto=format&fit=crop",
  prerequisites: [
    "Basic understanding of programming",
    "Familiarity with Python",
    "Basic mathematics and statistics knowledge"
  ],
  whatYoullLearn: [
    "Understand the fundamentals of machine learning",
    "Implement supervised and unsupervised learning algorithms",
    "Apply machine learning to real-world problems",
    "Evaluate and optimize machine learning models",
    "Use popular ML libraries and frameworks"
  ],
  modules: [
    {
      id: "m1",
      title: "Introduction to Machine Learning",
      lessons: [
        {
          id: "l1",
          title: "What is Machine Learning?",
          duration: "12 min",
          type: "video",
          completed: true,
        },
        {
          id: "l2",
          title: "Types of Machine Learning",
          duration: "15 min",
          type: "video",
          completed: true,
        },
        {
          id: "l3",
          title: "Machine Learning Applications",
          duration: "20 min",
          type: "reading",
          completed: true,
        },
        {
          id: "l4",
          title: "Module Quiz",
          duration: "10 min",
          type: "quiz",
          completed: true,
        },
      ],
    },
    {
      id: "m2",
      title: "Supervised Learning Algorithms",
      lessons: [
        {
          id: "l5",
          title: "Linear Regression",
          duration: "25 min",
          type: "video",
          completed: true,
        },
        {
          id: "l6",
          title: "Decision Trees",
          duration: "18 min",
          type: "video",
          completed: true,
        },
        {
          id: "l7",
          title: "Support Vector Machines",
          duration: "22 min",
          type: "video",
          completed: false,
        },
        {
          id: "l8",
          title: "Hands-on Exercise",
          duration: "30 min",
          type: "exercise",
          completed: false,
        },
        {
          id: "l9",
          title: "Module Quiz",
          duration: "15 min",
          type: "quiz",
          completed: false,
        },
      ],
    },
    {
      id: "m3",
      title: "Unsupervised Learning",
      lessons: [
        {
          id: "l10",
          title: "Clustering Algorithms",
          duration: "20 min",
          type: "video",
          completed: false,
        },
        {
          id: "l11",
          title: "Dimensionality Reduction",
          duration: "15 min",
          type: "video",
          completed: false,
        },
        {
          id: "l12",
          title: "Practical Applications",
          duration: "25 min",
          type: "reading",
          completed: false,
        },
        {
          id: "l13",
          title: "Hands-on Exercise",
          duration: "35 min",
          type: "exercise",
          completed: false,
        },
        {
          id: "l14",
          title: "Module Quiz",
          duration: "15 min",
          type: "quiz",
          completed: false,
        },
      ],
    },
    {
      id: "m4",
      title: "Model Evaluation and Optimization",
      lessons: [
        {
          id: "l15",
          title: "Performance Metrics",
          duration: "18 min",
          type: "video",
          completed: false,
        },
        {
          id: "l16",
          title: "Cross-Validation",
          duration: "14 min",
          type: "video",
          completed: false,
        },
        {
          id: "l17",
          title: "Hyperparameter Tuning",
          duration: "22 min",
          type: "video",
          completed: false,
        },
        {
          id: "l18",
          title: "Final Project",
          duration: "60 min",
          type: "project",
          completed: false,
        },
        {
          id: "l19",
          title: "Final Exam",
          duration: "30 min",
          type: "exam",
          completed: false,
        },
      ],
    },
  ],
};

const CourseDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [activeModule, setActiveModule] = useState<string | undefined>(undefined);
  const [expandedSections, setExpandedSections] = useState<string[]>(["whatYoullLearn"]);
  
  // In a real app, you would fetch the course data based on the ID
  const course = mockCourse;
  
  const totalLessons = course.modules.reduce(
    (total, module) => total + module.lessons.length,
    0
  );
  
  const completedLessons = course.modules.reduce(
    (total, module) =>
      total + module.lessons.filter((lesson) => lesson.completed).length,
    0
  );
  
  const progress = Math.round((completedLessons / totalLessons) * 100);
  
  const toggleSection = (section: string) => {
    setExpandedSections((prev) =>
      prev.includes(section)
        ? prev.filter((s) => s !== section)
        : [...prev, section]
    );
  };
  
  const isSectionExpanded = (section: string) => expandedSections.includes(section);
  
  const getLessonIcon = (type: string) => {
    switch (type) {
      case "video":
        return <PlayCircle size={16} />;
      case "reading":
        return <FileText size={16} />;
      case "quiz":
      case "exam":
        return <BookOpen size={16} />;
      case "exercise":
      case "project":
        return <FileText size={16} />;
      default:
        return <BookOpen size={16} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-secondary/20">
      <Navbar />

      <main className="flex-1 pt-24 pb-16">
        {/* Hero Section */}
        <div className="bg-white border-b">
          <div className="container px-4 md:px-6 py-8">
            <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
              <div className="space-y-4 animate-fade-in">
                <div className="space-y-2">
                  <Badge className="mb-2">{course.category}</Badge>
                  <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                    {course.title}
                  </h1>
                  <p className="text-muted-foreground">
                    {course.description.split(". ")[0]}.
                  </p>
                </div>
                
                <div className="flex flex-wrap gap-6 text-sm">
                  <div className="flex items-center gap-1.5">
                    <Clock size={16} className="text-muted-foreground" />
                    <span>{course.duration}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <BarChart2 size={16} className="text-muted-foreground" />
                    <span>{course.level}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users size={16} className="text-muted-foreground" />
                    <span>{course.enrolled.toLocaleString()} enrolled</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Star size={16} className="text-amber-500 fill-amber-500" />
                    <span>
                      {course.rating} ({course.reviews} reviews)
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <img
                    src="https://images.unsplash.com/photo-1628890923662-2cb23c2e0cfe?q=80&w=200&auto=format&fit=crop"
                    alt={course.instructor}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-medium">{course.instructor}</p>
                    <p className="text-sm text-muted-foreground">Instructor</p>
                  </div>
                </div>
                
                {progress > 0 && (
                  <div className="pt-2">
                    <ProgressIndicator progress={progress} />
                  </div>
                )}
              </div>
              
              <div className="animate-fade-in opacity-0" style={{ animationDelay: "200ms", animationFillMode: "forwards" }}>
                <Card className="overflow-hidden">
                  <div className="aspect-video overflow-hidden">
                    <img
                      src={course.image}
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <CardContent className="p-6 space-y-4">
                    <div className="flex gap-2">
                      {progress > 0 ? (
                        <Button className="w-full" size="lg">
                          Continue Learning
                        </Button>
                      ) : (
                        <Button className="w-full" size="lg">
                          Start Course
                        </Button>
                      )}
                    </div>
                    
                    <div className="pt-2 text-sm text-center text-muted-foreground">
                      Last updated: {course.lastUpdated}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
        
        {/* Course Content */}
        <div className="container px-4 md:px-6 py-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
            <div>
              {/* About This Course */}
              <section className="mb-8 animate-fade-in opacity-0" style={{ animationDelay: "300ms", animationFillMode: "forwards" }}>
                <div
                  className="flex justify-between items-center cursor-pointer"
                  onClick={() => toggleSection("about")}
                >
                  <h2 className="text-xl font-semibold">About This Course</h2>
                  {isSectionExpanded("about") ? (
                    <ChevronUp size={20} />
                  ) : (
                    <ChevronDown size={20} />
                  )}
                </div>
                {isSectionExpanded("about") && (
                  <div className="mt-4 prose max-w-none">
                    <p className="text-muted-foreground mb-4">
                      {course.description}
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                      <div>
                        <h3 className="text-base font-semibold mb-2">Prerequisites</h3>
                        <ul className="space-y-2">
                          {course.prerequisites.map((prerequisite, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <CheckCircle size={16} className="text-primary mt-1 flex-shrink-0" />
                              <span>{prerequisite}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
                <Separator className="mt-6" />
              </section>
              
              {/* What You'll Learn */}
              <section className="mb-8 animate-fade-in opacity-0" style={{ animationDelay: "400ms", animationFillMode: "forwards" }}>
                <div
                  className="flex justify-between items-center cursor-pointer"
                  onClick={() => toggleSection("whatYoullLearn")}
                >
                  <h2 className="text-xl font-semibold">What You'll Learn</h2>
                  {isSectionExpanded("whatYoullLearn") ? (
                    <ChevronUp size={20} />
                  ) : (
                    <ChevronDown size={20} />
                  )}
                </div>
                {isSectionExpanded("whatYoullLearn") && (
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                    {course.whatYoullLearn.map((item, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <CheckCircle size={16} className="text-primary mt-1 flex-shrink-0" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                )}
                <Separator className="mt-6" />
              </section>
              
              {/* Course Content */}
              <section className="animate-fade-in opacity-0" style={{ animationDelay: "500ms", animationFillMode: "forwards" }}>
                <div
                  className="flex justify-between items-center cursor-pointer"
                  onClick={() => toggleSection("content")}
                >
                  <h2 className="text-xl font-semibold">Course Content</h2>
                  {isSectionExpanded("content") ? (
                    <ChevronUp size={20} />
                  ) : (
                    <ChevronDown size={20} />
                  )}
                </div>
                {isSectionExpanded("content") && (
                  <div className="mt-4">
                    <div className="flex justify-between items-center mb-4 text-sm">
                      <div>
                        {course.modules.length} modules • {totalLessons} lessons • {course.duration}
                      </div>
                      <button className="text-primary hover:underline">
                        {activeModule ? "Collapse All" : "Expand All"}
                      </button>
                    </div>
                    
                    <Accordion
                      type="single"
                      collapsible
                      value={activeModule}
                      onValueChange={setActiveModule}
                      className="border rounded-md"
                    >
                      {course.modules.map((module, moduleIndex) => {
                        const moduleLessons = module.lessons.length;
                        const moduleCompletedLessons = module.lessons.filter(
                          (l) => l.completed
                        ).length;
                        const moduleProgress = Math.round(
                          (moduleCompletedLessons / moduleLessons) * 100
                        );
                        
                        return (
                          <AccordionItem
                            key={module.id}
                            value={module.id}
                            className={moduleIndex !== course.modules.length - 1 ? "border-b" : ""}
                          >
                            <AccordionTrigger className="px-4 py-3 hover:no-underline">
                              <div className="flex-1 flex flex-col text-left">
                                <div className="flex items-center justify-between w-full">
                                  <span className="font-medium">
                                    {moduleIndex + 1}. {module.title}
                                  </span>
                                  <span className="text-sm text-muted-foreground mr-2">
                                    {moduleCompletedLessons}/{moduleLessons}
                                  </span>
                                </div>
                                {/* Progress bar for each module */}
                                <div className="w-full h-1 bg-secondary mt-2 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-primary transition-all"
                                    style={{ width: `${moduleProgress}%` }}
                                  />
                                </div>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="px-0">
                              <ul className="divide-y">
                                {module.lessons.map((lesson, lessonIndex) => (
                                  <li
                                    key={lesson.id}
                                    className="flex items-center px-4 py-3 hover:bg-secondary/40 transition-colors"
                                  >
                                    <div className="mr-3">
                                      {lesson.completed ? (
                                        <CheckCircle size={18} className="text-primary fill-primary" />
                                      ) : (
                                        <div className="w-[18px] h-[18px] rounded-full border-2 border-muted" />
                                      )}
                                    </div>
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        {getLessonIcon(lesson.type)}
                                        <span className={lesson.completed ? "text-muted-foreground" : ""}>
                                          {lessonIndex + 1}. {lesson.title}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      {lesson.duration}
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            </AccordionContent>
                          </AccordionItem>
                        );
                      })}
                    </Accordion>
                  </div>
                )}
              </section>
            </div>
            
            {/* Sidebar - Related Courses or Resources */}
            <div className="space-y-6 animate-fade-in opacity-0" style={{ animationDelay: "600ms", animationFillMode: "forwards" }}>
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4">Course Resources</h3>
                  <ul className="space-y-2">
                    <li>
                      <Button variant="ghost" className="w-full justify-start gap-2">
                        <FileText size={16} />
                        Course Slides
                      </Button>
                    </li>
                    <li>
                      <Button variant="ghost" className="w-full justify-start gap-2">
                        <FileText size={16} />
                        Exercise Files
                      </Button>
                    </li>
                    <li>
                      <Button variant="ghost" className="w-full justify-start gap-2">
                        <FileText size={16} />
                        Supplementary Readings
                      </Button>
                    </li>
                  </ul>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4">Related Paths</h3>
                  <ul className="space-y-4">
                    <li className="flex gap-3">
                      <div className="w-16 h-12 bg-secondary rounded flex items-center justify-center flex-shrink-0">
                        <BookOpen size={20} className="text-muted-foreground" />
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">Data Science Path</h4>
                        <p className="text-xs text-muted-foreground">12 courses • 160 hours</p>
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <div className="w-16 h-12 bg-secondary rounded flex items-center justify-center flex-shrink-0">
                        <BookOpen size={20} className="text-muted-foreground" />
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">AI Engineer Path</h4>
                        <p className="text-xs text-muted-foreground">15 courses • 180 hours</p>
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <div className="w-16 h-12 bg-secondary rounded flex items-center justify-center flex-shrink-0">
                        <BookOpen size={20} className="text-muted-foreground" />
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">Python Developer Path</h4>
                        <p className="text-xs text-muted-foreground">10 courses • 120 hours</p>
                      </div>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CourseDetail;
