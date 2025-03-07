import React from "@/lib/react-helpers";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft, BookOpen } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";

const ProgramsPage: React.FC = () => {
  const navigate = useNavigate();

  const goBack = () => {
    navigate("/hr-dashboard");
  };

  // Sample learning programs data
  const programs = [
    {
      id: "1",
      title: "New Employee Onboarding",
      description: "Essential training for all new employees covering company policies, tools, and processes.",
      enrolledCount: 42,
      modules: 8,
      duration: "2 weeks"
    },
    {
      id: "2",
      title: "Leadership Fundamentals",
      description: "Core leadership skills for new and aspiring managers.",
      enrolledCount: 16,
      modules: 12,
      duration: "4 weeks"
    },
    {
      id: "3",
      title: "Technical Skills: Web Development",
      description: "Modern web development practices and tools for the engineering team.",
      enrolledCount: 28,
      modules: 15,
      duration: "6 weeks"
    }
  ];

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button variant="ghost" size="sm" onClick={goBack} className="mr-4">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-2xl font-bold">Learning Programs</h1>
        </div>
        <Button>
          <BookOpen className="h-4 w-4 mr-2" />
          Create New Program
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {programs.map(program => (
          <Card key={program.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>{program.title}</CardTitle>
              <CardDescription>{program.enrolledCount} employees enrolled</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">{program.description}</p>
              <div className="flex justify-between text-sm text-gray-500">
                <span>{program.modules} modules</span>
                <span>{program.duration}</span>
              </div>
              <div className="mt-4 flex space-x-2">
                <Button variant="outline" size="sm" className="flex-1">Edit</Button>
                <Button variant="outline" size="sm" className="flex-1">Assign</Button>
                <Button variant="outline" size="sm" className="flex-1">View</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ProgramsPage; 