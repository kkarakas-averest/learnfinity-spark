import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';

type Employee = {
  id: string;
  name: string;
  email: string;
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

export const BulkSkillsAssessment: React.FC = () => {
  const [employees, setEmployees] = React.useState<Employee[]>([]);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = React.useState<string[]>([]);
  const [assessmentResults, setAssessmentResults] = React.useState<AssessmentResult[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [showModal, setShowModal] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Fetch employees on mount
  React.useEffect(() => {
    fetch('/api/hr/employees')
      .then(res => res.json())
      .then(data => setEmployees(data.employees))
      .catch((e: Error) => setError('Failed to fetch employees'));
  }, []);

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
        // 1. Fetch assigned courses
        const coursesRes = await fetch(`/api/hr/employee-courses?employeeId=${employeeId}`);
        const courses: Course[] = (await coursesRes.json()).courses;

        // 2. Fetch employee skills
        const skillsRes = await fetch(`/api/hr/employee-skills?employeeId=${employeeId}`);
        const employeeSkills: string[] = (await skillsRes.json()).skills;

        // 3. For each course, fetch required skills and compute missing
        for (const course of courses) {
          // If course.skills is not present, fetch course details
          let courseSkills = course.skills;
          if (!courseSkills || courseSkills.length === 0) {
            const courseRes = await fetch(`/api/hr/courses/${course.id}`);
            courseSkills = (await courseRes.json()).skills;
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
      }
      setAssessmentResults(results);
    } catch (err) {
      setError('Failed to perform skills assessment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Employee Table with Selection */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
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
          <Button onClick={handleAssessSkills}>Assess Skills</Button>
        </div>
      )}

      {/* Assessment Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Skills Assessment</DialogTitle>
          </DialogHeader>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-3">Assessing skills...</span>
            </div>
          ) : error ? (
            <div className="text-red-600">{error}</div>
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
                        {result.employeeSkills.join(', ')}
                      </TableCell>
                      <TableCell>
                        {result.missingSkills.length > 0
                          ? result.missingSkills.join(', ')
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