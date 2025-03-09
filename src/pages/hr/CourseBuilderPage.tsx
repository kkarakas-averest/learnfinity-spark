import React from '@/lib/react-helpers';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Layers, Library, BookOpen, Users, Zap } from 'lucide-react';

/**
 * CourseBuilderPage serves as a hub for HR administrators to create and manage
 * learning content for the organization, and use these resources for interventions.
 */
const CourseBuilderPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Course Builder</h1>
        <p className="text-gray-500">
          Create, manage and customize learning content for your organization
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-8">
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tools">Builder Tools</TabsTrigger>
          <TabsTrigger value="interventions">Interventions</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="col-span-full">
              <Card>
                <CardHeader>
                  <CardTitle>Course Builder Overview</CardTitle>
                  <CardDescription>
                    Build and manage learning content for your organization
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="mb-4">
                    The Course Builder provides tools to create and manage learning content for your organization.
                    Use templates to quickly create new courses, customize modules to meet specific learning needs,
                    and deploy content to employees as part of your learning and development strategy.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                    <div className="flex flex-col items-center text-center p-4 border rounded-lg">
                      <FileText className="h-10 w-10 text-blue-500 mb-2" />
                      <h3 className="font-medium">Course Templates</h3>
                      <p className="text-sm text-gray-500 mt-1">Reusable structures for quick course creation</p>
                    </div>
                    <div className="flex flex-col items-center text-center p-4 border rounded-lg">
                      <Layers className="h-10 w-10 text-indigo-500 mb-2" />
                      <h3 className="font-medium">Module Editor</h3>
                      <p className="text-sm text-gray-500 mt-1">Design learning modules with various content types</p>
                    </div>
                    <div className="flex flex-col items-center text-center p-4 border rounded-lg">
                      <Library className="h-10 w-10 text-purple-500 mb-2" />
                      <h3 className="font-medium">Content Library</h3>
                      <p className="text-sm text-gray-500 mt-1">Manage and reuse learning resources</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest actions in the course builder</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <div className="bg-blue-100 p-2 rounded-full mr-3">
                      <FileText className="h-4 w-4 text-blue-700" />
                    </div>
                    <div>
                      <p className="font-medium">New Template Created</p>
                      <p className="text-sm text-gray-500">Technical Skills Workshop</p>
                      <p className="text-xs text-gray-400">Today, 10:30 AM</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="bg-indigo-100 p-2 rounded-full mr-3">
                      <Layers className="h-4 w-4 text-indigo-700" />
                    </div>
                    <div>
                      <p className="font-medium">Module Updated</p>
                      <p className="text-sm text-gray-500">JavaScript Fundamentals</p>
                      <p className="text-xs text-gray-400">Yesterday, 4:15 PM</p>
                    </div>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
                <CardDescription>Course builder metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-500">Templates</p>
                    <p className="text-2xl font-bold">8</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-500">Modules</p>
                    <p className="text-2xl font-bold">24</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-500">Content Items</p>
                    <p className="text-2xl font-bold">97</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-500">Courses Created</p>
                    <p className="text-2xl font-bold">12</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Builder Tools Tab */}
        <TabsContent value="tools" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 text-blue-500 mr-2" />
                  Course Templates
                </CardTitle>
                <CardDescription>
                  Manage reusable course structures
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500 mb-4">
                  Create and manage course templates to streamline the course creation process.
                  Templates define module structure, content types, and default durations.
                </p>
              </CardContent>
              <CardFooter>
                <Button onClick={() => navigate('/hr-dashboard/course-builder/templates')}>
                  Manage Templates
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Layers className="h-5 w-5 text-indigo-500 mr-2" />
                  Module Editor
                </CardTitle>
                <CardDescription>
                  Design and customize learning modules
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500 mb-4">
                  Create and edit learning modules with various content types including
                  video, text, quizzes, and interactive elements. Organize content in a
                  logical learning sequence.
                </p>
              </CardContent>
              <CardFooter>
                <Button onClick={() => navigate('/hr-dashboard/course-builder/modules')}>
                  Open Module Editor
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BookOpen className="h-5 w-5 text-green-500 mr-2" />
                  Course Creator
                </CardTitle>
                <CardDescription>
                  Create complete courses from templates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500 mb-4">
                  Build complete courses using templates as a starting point. Customize modules,
                  add assessments, and set learning paths for different employee groups.
                </p>
              </CardContent>
              <CardFooter>
                <Button variant="outline">
                  Create Course
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        {/* Interventions Tab */}
        <TabsContent value="interventions" className="space-y-6">
          <Card className="col-span-full">
            <CardHeader>
              <CardTitle>Learning Interventions</CardTitle>
              <CardDescription>
                Use course builder tools to create targeted interventions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-6">
                When employees are flagged as Amber or Red in the RAG system, HR can create
                targeted interventions using the course builder tools. These interventions
                can include customized content, additional resources, or simplified materials
                to help employees improve their performance.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border rounded-lg p-5">
                  <div className="flex items-center mb-4">
                    <div className="bg-amber-100 p-2 rounded-full mr-3">
                      <Zap className="h-5 w-5 text-amber-600" />
                    </div>
                    <h3 className="text-lg font-medium">Amber Status Interventions</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    For employees with Amber status, create supplementary materials
                    and additional practice exercises to reinforce key concepts.
                  </p>
                  <ul className="text-sm space-y-2 mb-4">
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-500 mr-2"></div>
                      <span>Additional practice exercises</span>
                    </li>
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-500 mr-2"></div>
                      <span>Supplementary learning materials</span>
                    </li>
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-500 mr-2"></div>
                      <span>Alternative content formats</span>
                    </li>
                  </ul>
                  <Button variant="outline" className="w-full">Create Amber Intervention</Button>
                </div>

                <div className="border rounded-lg p-5">
                  <div className="flex items-center mb-4">
                    <div className="bg-red-100 p-2 rounded-full mr-3">
                      <Zap className="h-5 w-5 text-red-600" />
                    </div>
                    <h3 className="text-lg font-medium">Red Status Interventions</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    For employees with Red status, create simplified content,
                    one-on-one guidance materials, and remedial learning paths.
                  </p>
                  <ul className="text-sm space-y-2 mb-4">
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-500 mr-2"></div>
                      <span>Simplified content modules</span>
                    </li>
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-500 mr-2"></div>
                      <span>Step-by-step guided tutorials</span>
                    </li>
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-500 mr-2"></div>
                      <span>Fundamental concept review</span>
                    </li>
                  </ul>
                  <Button variant="outline" className="w-full">Create Red Intervention</Button>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={() => navigate('/hr-dashboard/employees')}>
                View Employees Needing Intervention
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CourseBuilderPage; 