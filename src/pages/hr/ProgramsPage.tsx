import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, BookOpen, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import LearningPathAssignment from "@/components/hr/LearningPathAssignment";

interface LearningProgram {
  id: string;
  title: string;
  description: string;
  enrolledCount: number;
  moduleCount: number;
  duration: string;
}

export default function ProgramsPage() {
  const [programs, setPrograms] = React.useState<LearningProgram[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [assignDialogOpen, setAssignDialogOpen] = React.useState(false);
  const [selectedProgramId, setSelectedProgramId] = React.useState<string | null>(null);

  // Fetch programs from the server (mock data for now)
  const fetchPrograms = async () => {
    try {
      setIsLoading(true);
      // Simulate API call with mock data
      const mockPrograms: LearningProgram[] = [
        {
          id: "prog-1",
          title: "Leadership Fundamentals",
          description: "Essential leadership skills for new managers",
          enrolledCount: 24,
          moduleCount: 5,
          duration: "10 weeks"
        },
        {
          id: "prog-2",
          title: "Technical Writing",
          description: "Learn to create clear technical documentation",
          enrolledCount: 15,
          moduleCount: 4,
          duration: "6 weeks"
        },
        {
          id: "prog-3",
          title: "Project Management",
          description: "Master the art of project execution",
          enrolledCount: 32,
          moduleCount: 8,
          duration: "12 weeks"
        }
      ];
      
      // Simulate network delay
      setTimeout(() => {
        setPrograms(mockPrograms);
        setIsLoading(false);
      }, 1000);
    } catch (err) {
      setError("Failed to load learning programs");
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchPrograms();
  }, []);

  const handleAssignProgram = (programId: string) => {
    setSelectedProgramId(programId);
    setAssignDialogOpen(true);
  };

  const handleBackToDashboard = () => {
    // Navigate back to dashboard (this would use a router in a real app)
    window.history.back();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center mb-8">
        <Button
          variant="ghost"
          size="sm"
          className="mr-2"
          onClick={handleBackToDashboard}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Dashboard
        </Button>
        <h1 className="text-3xl font-bold">Learning Programs</h1>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <p>Loading programs...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 p-4 rounded-md text-red-600">
          {error}
        </div>
      ) : (
        <>
          <div className="flex justify-end mb-6">
            <Button className="flex items-center">
              <span className="mr-2">+</span>
              Create New Program
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {programs.map((program) => (
              <Card key={program.id} className="transition-shadow hover:shadow-md">
                <CardHeader>
                  <CardTitle>{program.title}</CardTitle>
                  <CardDescription>{program.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex space-x-4 text-sm text-gray-500">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      <span>{program.enrolledCount} enrolled</span>
                    </div>
                    <div className="flex items-center">
                      <BookOpen className="h-4 w-4 mr-1" />
                      <span>{program.moduleCount} modules</span>
                    </div>
                    <div>
                      <span>{program.duration}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" size="sm">
                    Edit
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleAssignProgram(program.id)}
                  >
                    Assign
                  </Button>
                  <Button variant="secondary" size="sm">
                    View
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </>
      )}

      {assignDialogOpen && (
        <LearningPathAssignment
          programId={selectedProgramId!}
          open={assignDialogOpen}
          onOpenChange={setAssignDialogOpen}
        />
      )}
    </div>
  );
} 