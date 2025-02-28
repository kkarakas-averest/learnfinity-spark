import React, { useState } from 'react';
import { 
  BookOpen, 
  Layers, 
  Search, 
  Filter, 
  Settings, 
  UserPlus, 
  Calendar, 
  Clock, 
  Star, 
  MoreHorizontal,
  Bot,
  Edit
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Mock courses data
const courses = [
  {
    id: "c001",
    title: "Introduction to Data Science",
    description: "Learn the fundamentals of data science, including statistics, Python, and data visualization.",
    category: "Technical",
    skillLevel: "Beginner",
    enrolledCount: 87,
    completionRate: 68,
    duration: "8 hours",
    isAIGenerated: true,
    lastUpdate: "2 days ago",
    rating: 4.5,
  },
  {
    id: "c002",
    title: "Leadership Fundamentals",
    description: "Develop essential leadership skills for managing teams and driving performance.",
    category: "Soft Skills",
    skillLevel: "Intermediate",
    enrolledCount: 124,
    completionRate: 75,
    duration: "6 hours",
    isAIGenerated: false,
    lastUpdate: "1 week ago",
    rating: 4.8,
  },
  {
    id: "c003",
    title: "Project Management",
    description: "Master the skills needed to manage projects efficiently from planning to completion.",
    category: "Business",
    skillLevel: "Intermediate",
    enrolledCount: 95,
    completionRate: 62,
    duration: "10 hours",
    isAIGenerated: true,
    lastUpdate: "3 days ago",
    rating: 4.2,
  },
  {
    id: "c004",
    title: "Cloud Architecture Fundamentals",
    description: "Learn the principles of designing and implementing cloud infrastructure.",
    category: "Technical",
    skillLevel: "Advanced",
    enrolledCount: 56,
    completionRate: 48,
    duration: "12 hours",
    isAIGenerated: false,
    lastUpdate: "2 weeks ago",
    rating: 4.6,
  },
  {
    id: "c005",
    title: "Effective Communication",
    description: "Improve your communication skills for better workplace interactions and presentations.",
    category: "Soft Skills",
    skillLevel: "Beginner",
    enrolledCount: 142,
    completionRate: 81,
    duration: "4 hours",
    isAIGenerated: true,
    lastUpdate: "5 days ago",
    rating: 4.7,
  }
];

// Mock learning paths
const learningPaths = [
  {
    id: "lp001",
    title: "Data Professional Path",
    description: "Comprehensive learning path for aspiring data professionals",
    courses: ["c001", "c004", "c003"],
    enrolledCount: 45,
    skillLevel: "Intermediate",
    duration: "30 hours",
  },
  {
    id: "lp002",
    title: "Management Track",
    description: "Essential skills for new and aspiring managers",
    courses: ["c002", "c003", "c005"],
    enrolledCount: 68,
    skillLevel: "Intermediate",
    duration: "22 hours",
  },
  {
    id: "lp003",
    title: "Technical Onboarding",
    description: "Foundational technical skills for new employees",
    courses: ["c001", "c004"],
    enrolledCount: 34,
    skillLevel: "Beginner",
    duration: "20 hours",
  }
];

// Function to get the skill level badge color
const getSkillLevelBadge = (level: string) => {
  switch(level.toLowerCase()) {
    case "beginner":
      return "bg-green-100 text-green-800 hover:bg-green-200";
    case "intermediate":
      return "bg-blue-100 text-blue-800 hover:bg-blue-200";
    case "advanced":
      return "bg-purple-100 text-purple-800 hover:bg-purple-200";
    default:
      return "bg-gray-100 text-gray-800 hover:bg-gray-200";
  }
};

const CourseManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSkillLevel, setSelectedSkillLevel] = useState('all');
  const [activeTab, setActiveTab] = useState('courses');
  const [showAIOnly, setShowAIOnly] = useState(false);

  // Filter courses based on search, category, skill level, and AI option
  const filteredCourses = courses.filter(course => {
    const matchesSearch = 
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = 
      selectedCategory === 'all' || 
      course.category.toLowerCase() === selectedCategory.toLowerCase();
    
    const matchesSkillLevel = 
      selectedSkillLevel === 'all' || 
      course.skillLevel.toLowerCase() === selectedSkillLevel.toLowerCase();
    
    const matchesAI = showAIOnly ? course.isAIGenerated : true;
    
    return matchesSearch && matchesCategory && matchesSkillLevel && matchesAI;
  });

  // Filter learning paths based on search
  const filteredLearningPaths = learningPaths.filter(path =>
    path.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    path.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="ai-content">AI Content</TabsTrigger>
          <TabsTrigger value="learning-paths">Learning Paths</TabsTrigger>
        </TabsList>

        {/* Courses Tab */}
        <TabsContent value="courses" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle>Course Catalog</CardTitle>
                  <CardDescription>Browse and manage available courses</CardDescription>
                </div>
                <Button size="sm" className="gap-1">
                  <BookOpen className="h-4 w-4" />
                  <span>Add Course</span>
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search courses..." 
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="w-full md:w-auto flex flex-col md:flex-row gap-2">
                  <Select 
                    value={selectedCategory}
                    onValueChange={setSelectedCategory}
                  >
                    <SelectTrigger className="w-full md:w-[180px]">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="technical">Technical</SelectItem>
                      <SelectItem value="business">Business</SelectItem>
                      <SelectItem value="soft skills">Soft Skills</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={selectedSkillLevel}
                    onValueChange={setSelectedSkillLevel}
                  >
                    <SelectTrigger className="w-full md:w-[180px]">
                      <SelectValue placeholder="All Levels" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Levels</SelectItem>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[300px]">Course</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead className="text-center">Enrolled</TableHead>
                      <TableHead className="text-center">Completion</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCourses.length > 0 ? (
                      filteredCourses.map(course => (
                        <TableRow key={course.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium group flex items-center gap-2">
                                {course.title}
                                {course.isAIGenerated && (
                                  <Badge variant="outline" className="bg-indigo-50 text-indigo-700 text-xs">AI</Badge>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {course.duration}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{course.category}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={getSkillLevelBadge(course.skillLevel)}>
                              {course.skillLevel}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">{course.enrolledCount}</TableCell>
                          <TableCell className="text-center">{course.completionRate}%</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit Course
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <UserPlus className="h-4 w-4 mr-2" />
                                  Assign to Employees
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                  <Layers className="h-4 w-4 mr-2" />
                                  Add to Learning Path
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No courses match your search criteria
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Content Tab */}
        <TabsContent value="ai-content" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>AI-Generated Content</CardTitle>
              <CardDescription>Review and customize AI-generated learning content</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between border-b pb-4 mb-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="show-ai-only"
                      checked={showAIOnly}
                      onCheckedChange={setShowAIOnly}
                    />
                    <Label htmlFor="show-ai-only">
                      Show AI-generated courses only
                    </Label>
                  </div>
                </div>
                <Button variant="outline" className="gap-1">
                  <Bot className="h-4 w-4" />
                  Generate New Course
                </Button>
              </div>
              
              <div className="space-y-6">
                {courses.filter(c => showAIOnly ? c.isAIGenerated : true).map(course => (
                  <div key={course.id} className="border rounded-md p-4">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium">{course.title}</h3>
                          {course.isAIGenerated && (
                            <Badge variant="outline" className="bg-indigo-50 text-indigo-700">AI Generated</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{course.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm">
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
                            {course.duration}
                          </div>
                          <div className="flex items-center">
                            <Star className="h-4 w-4 mr-1 text-amber-500" />
                            {course.rating}
                          </div>
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                            Updated {course.lastUpdate}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button variant="outline" size="sm" className="gap-1">
                          <Edit className="h-4 w-4" />
                          <span>Customize</span>
                        </Button>
                        <Button variant="ghost" size="sm">View Content</Button>
                      </div>
                    </div>
                    
                    {course.isAIGenerated && (
                      <div className="mt-4 pt-4 border-t">
                        <h4 className="text-sm font-medium mb-2">AI Content Settings</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <Label htmlFor={`depth-${course.id}`} className="text-xs">Content Depth</Label>
                            <Slider
                              id={`depth-${course.id}`}
                              defaultValue={[75]}
                              max={100}
                              step={25}
                              className="py-2"
                            />
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>Overview</span>
                              <span>Detailed</span>
                            </div>
                          </div>
                          
                          <div className="space-y-1">
                            <Label htmlFor={`tech-${course.id}`} className="text-xs">Technical Level</Label>
                            <Slider
                              id={`tech-${course.id}`}
                              defaultValue={[50]}
                              max={100}
                              step={25}
                              className="py-2"
                            />
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>Beginner</span>
                              <span>Expert</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4">
                          <div className="flex items-center space-x-2">
                            <Checkbox id={`interactive-${course.id}`} />
                            <Label htmlFor={`interactive-${course.id}`} className="text-xs">
                              Interactive
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox id={`case-studies-${course.id}`} defaultChecked />
                            <Label htmlFor={`case-studies-${course.id}`} className="text-xs">
                              Case Studies
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox id={`exercises-${course.id}`} defaultChecked />
                            <Label htmlFor={`exercises-${course.id}`} className="text-xs">
                              Exercises
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox id={`assessments-${course.id}`} />
                            <Label htmlFor={`assessments-${course.id}`} className="text-xs">
                              Assessments
                            </Label>
                          </div>
                        </div>
                        
                        <Button size="sm" className="mt-4 gap-1">
                          <Bot className="h-4 w-4" />
                          <span>Regenerate Content</span>
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Learning Paths Tab */}
        <TabsContent value="learning-paths" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle>Learning Paths</CardTitle>
                  <CardDescription>Configure and manage learning journeys</CardDescription>
                </div>
                <Button size="sm" className="gap-1">
                  <Layers className="h-4 w-4" />
                  <span>Create Learning Path</span>
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search learning paths..." 
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="space-y-6">
                {filteredLearningPaths.length > 0 ? (
                  filteredLearningPaths.map(path => (
                    <div key={path.id} className="border rounded-md overflow-hidden">
                      <div className="p-4 bg-secondary/20">
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                          <div>
                            <h3 className="font-medium">{path.title}</h3>
                            <p className="text-sm text-muted-foreground">{path.description}</p>
                            <div className="flex flex-wrap items-center gap-4 mt-2 text-sm">
                              <Badge variant="outline" className={getSkillLevelBadge(path.skillLevel)}>
                                {path.skillLevel}
                              </Badge>
                              <div className="flex items-center">
                                <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
                                {path.duration}
                              </div>
                              <div className="flex items-center">
                                <UserPlus className="h-4 w-4 mr-1 text-muted-foreground" />
                                {path.enrolledCount} enrolled
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button size="sm" variant="outline" className="gap-1">
                              <UserPlus className="h-4 w-4" />
                              <span>Assign</span>
                            </Button>
                            <Button size="sm" variant="outline" className="gap-1">
                              <Edit className="h-4 w-4" />
                              <span>Edit</span>
                            </Button>
                            <Button size="sm" variant="outline" className="gap-1">
                              <Settings className="h-4 w-4" />
                              <span>Configure</span>
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div className="p-4">
                        <h4 className="text-sm font-medium mb-3">Included Courses</h4>
                        <div className="space-y-2">
                          {path.courses.map(courseId => {
                            const course = courses.find(c => c.id === courseId);
                            if (!course) return null;
                            
                            return (
                              <div key={courseId} className="flex justify-between items-center p-2 bg-secondary/10 rounded-md">
                                <div className="flex items-center gap-2">
                                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm">{course.title}</span>
                                  {course.isAIGenerated && (
                                    <Badge variant="outline" className="text-xs bg-indigo-50 text-indigo-700">AI</Badge>
                                  )}
                                </div>
                                <span className="text-xs text-muted-foreground">{course.duration}</span>
                              </div>
                            );
                          })}
                        </div>
                        
                        <Button variant="ghost" size="sm" className="mt-4 w-full">
                          Add Course to Path
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No learning paths match your search criteria
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CourseManagement; 