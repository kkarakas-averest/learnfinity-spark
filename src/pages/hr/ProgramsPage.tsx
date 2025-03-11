import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, BookOpen, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import LearningPathAssignment from "@/components/hr/LearningPathAssignment";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";

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

  // Fetch real learning programs from the database
  const fetchPrograms = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch learning paths from Supabase
      const { data: pathsData, error: pathsError } = await supabase
        .from('learning_paths')
        .select('*')
        .order('title');
      
      if (pathsError) {
        throw new Error(pathsError.message);
      }
      
      // For each learning path, fetch enrollment count and module count
      const transformedPrograms = await Promise.all(pathsData.map(async (path) => {
        // Get enrollment count from learning_path_assignments
        const { count: enrolledCount, error: enrollmentError } = await supabase
          .from('learning_path_assignments')
          .select('id', { count: 'exact', head: true })
          .eq('learning_path_id', path.id);
        
        if (enrollmentError) {
          console.error(`Error fetching enrollment count for path ${path.id}:`, enrollmentError);
        }
        
        // Get module/course count
        const { data: modulesData, error: modulesError } = await supabase
          .from('learning_path_courses')
          .select('id', { count: 'exact' })
          .eq('learning_path_id', path.id);
        
        if (modulesError) {
          console.error(`Error fetching modules for path ${path.id}:`, modulesError);
        }
        
        // Calculate weeks based on expected hours per week (assuming 5 hours/week)
        const durationWeeks = path.estimated_hours 
          ? Math.ceil(path.estimated_hours / 5) 
          : 'Varies';
          
        return {
          id: path.id,
          title: path.title || 'Untitled Program',
          description: path.description || 'No description available',
          enrolledCount: enrolledCount || 0,
          moduleCount: modulesData?.length || 0,
          duration: typeof durationWeeks === 'number' ? `${durationWeeks} weeks` : durationWeeks
        };
      }));
      
      setPrograms(transformedPrograms);
    } catch (err: any) {
      console.error('Error fetching learning programs:', err);
      setError(err.message || 'Failed to load learning programs');
      
      toast({
        variant: 'destructive',
        title: 'Error loading programs',
        description: 'There was a problem loading the learning programs. Please try again later.'
      });
    } finally {
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
          <Button variant="outline" size="sm" className="ml-4" onClick={fetchPrograms}>
            Retry
          </Button>
        </div>
      ) : programs.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <h3 className="text-xl font-medium mb-2">No Learning Programs Found</h3>
          <p className="text-gray-500 mb-4">There are no learning programs available at this time.</p>
          <Button className="flex items-center mx-auto">
            <span className="mr-2">+</span>
            Create First Program
          </Button>
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