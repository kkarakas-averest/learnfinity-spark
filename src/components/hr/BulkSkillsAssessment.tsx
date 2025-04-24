import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/components/ui/use-toast';

type Employee = {
  id: string;
  name: string;
  email: string;
  [key: string]: any;
};

type Course = {
  id: string;
  title: string;
  skills: string[];
};

type AssessmentResult = {
  employee: Employee;
  course: Course;
  employeeSkills: string[];
  missingSkills: string[];
};

interface BulkSkillsAssessmentProps {
  employees: Employee[];
}

export const BulkSkillsAssessment: React.FC<BulkSkillsAssessmentProps> = ({ employees }: BulkSkillsAssessmentProps) => {
  const [selectedEmployeeIds, setSelectedEmployeeIds] = React.useState<string[]>([]);
  const [assessmentResults, setAssessmentResults] = React.useState<AssessmentResult[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [showModal, setShowModal] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSelectAll = (checked: boolean) => {
    setSelectedEmployeeIds(checked ? employees.map((e: Employee) => e.id) : []);
  };

  const handleSelectEmployee = (id: string, checked: boolean) => {
    setSelectedEmployeeIds((prev: string[]) =>
      checked ? [...prev, id] : prev.filter((eid: string) => eid !== id)
    );
  };

  const handleAssessSkills = async () => {
    setLoading(true);
    setShowModal(true);
    setAssessmentResults([]);
    setError(null);

    try {
      const results: AssessmentResult[] = [];
      for (const employeeId of selectedEmployeeIds) {
        try {
          // 1. Fetch assigned courses
          const coursesRes = await fetch(`/api/hr/employee-courses?employeeId=${employeeId}`);
          if (!coursesRes.ok) {
            throw new Error(`Failed to fetch courses: ${coursesRes.statusText}`);
          }
          const coursesData = await coursesRes.json();
          const courses: Course[] = coursesData.courses || [];

          // 2. Fetch employee skills
          const skillsRes = await fetch(`/api/hr/employee-skills?employeeId=${employeeId}`);
          if (!skillsRes.ok) {
            throw new Error(`Failed to fetch skills: ${skillsRes.statusText}`);
          }
          const skillsData = await skillsRes.json();
          const employeeSkills: string[] = skillsData.skills || [];

          // Skip employees with no assigned courses
          if (courses.length === 0) {
            continue;
          }

          // 3. For each course, fetch required skills and compute missing
          for (const course of courses) {
            // If course.skills is not present, fetch course details
            let courseSkills = course.skills || [];
            if (courseSkills.length === 0) {
              try {
                const courseRes = await fetch(`/api/hr/courses/${course.id}`);
                if (courseRes.ok) {
                  const courseData = await courseRes.json();
                  courseSkills = courseData.skills || [];
                }
              } catch (err) {
                console.error('Error fetching course details:', err);
              }
            }

            // Skip courses with no skills
            if (courseSkills.length === 0) {
              continue;
            }

            // Compute missing skills
            const missingSkills = courseSkills.filter(
              skill => !employeeSkills.includes(skill)
            );

            results.push({
              employee: employees.find((e: Employee) => e.id === employeeId)!,
              course: { ...course, skills: courseSkills },
              employeeSkills,
              missingSkills,
            });
          }
        } catch (employeeError) {
          console.error(`Error processing employee ${employeeId}:`, employeeError);
          // Continue with next employee
        }
      }

      if (results.length === 0) {
        toast({
          title: "No assessment results",
          description: "No skills gaps were found, or the selected employees have no assigned courses with skills.",
          variant: "default"
        });
      }

      setAssessmentResults(results);
    } catch (err) {
      console.error('Failed to perform skills assessment:', err);
      setError('Failed to perform skills assessment');
      toast({
        title: "Assessment failed",
        description: "There was an error performing the skills assessment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white p-6 rounded-lg border shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Skills Gap Assessment</h2>
        <p className="text-gray-600 mb-4">
          Select employees to identify skills gaps between assigned courses and current skills.
        </p>
        
        {/* Employee Selection Table */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedEmployeeIds.length === employees.length && employees.length > 0}
                  onCheckedChange={(checked: boolean | 'indeterminate') => handleSelectAll(!!checked)}
                />
              </TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.map((emp: Employee) => (
              <TableRow key={emp.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedEmployeeIds.includes(emp.id)}
                    onCheckedChange={(checked: boolean | 'indeterminate') => handleSelectEmployee(emp.id, !!checked)}
                  />
                </TableCell>
                <TableCell>{emp.name}</TableCell>
                <TableCell>{emp.email}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Bulk Actions Bar */}
        {selectedEmployeeIds.length > 0 && (
          <div className="flex items-center gap-4 mt-4">
            <Button onClick={handleAssessSkills}>Assess Skills Gaps</Button>
          </div>
        )}
      </div>

      {/* Assessment Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>Skills Gap Assessment Results</DialogTitle>
          </DialogHeader>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-3">Assessing skills...</span>
            </div>
          ) : error ? (
            <div className="text-red-600">{error}</div>
          ) : assessmentResults.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No assessment results found. Employees may not have assigned courses with skills, or their skills already cover course requirements.</p>
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[60vh]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Required Skills</TableHead>
                    <TableHead>Employee Skills</TableHead>
                    <TableHead>Missing Skills</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assessmentResults.map((result: AssessmentResult, idx: number) => (
                    <TableRow key={idx}>
                      <TableCell>{result.employee.name}</TableCell>
                      <TableCell>{result.course.title}</TableCell>
                      <TableCell>
                        {result.course.skills.join(', ')}
                      </TableCell>
                      <TableCell>
                        {result.employeeSkills.length > 0 ? 
                          result.employeeSkills.join(', ') : 
                          <span className="text-gray-400">No skills found</span>}
                      </TableCell>
                      <TableCell>
                        {result.missingSkills.length > 0
                          ? <span className="text-amber-600">{result.missingSkills.join(', ')}</span>
                          : <span className="text-green-600">No gaps</span>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}; 