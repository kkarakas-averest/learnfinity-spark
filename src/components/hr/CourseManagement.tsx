import React from "@/lib/react-helpers";
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { hrCourseService } from '@/services/hrCourseService';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { PageHeader } from '@/components/PageHeader';
import { ROUTES } from '@/lib/routes';
import { Button } from '@/components/ui/button';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter 
} from '@/components/ui/dialog';
import { 
  Alert, 
  AlertTitle, 
  AlertDescription 
} from '@/components/ui/alert';
import { Plus, Edit, Trash2, AlertCircle } from 'lucide-react';
import CourseForm from './CourseForm';
import { DataTable } from "@/components/ui/table"
import { columns } from "@/components/hr/data/columns"

const CourseManagement = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [errorDetails, setErrorDetails] = useState(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const { data, error } = await hrCourseService.getCourses();
        if (error) {
          console.error('Error fetching courses:', error);
          toast.error('Failed to load courses. Please check the console for details.');
          setErrorDetails({
            message: error.message,
            code: error.code,
            hint: error.hint
          });
        } else {
          setCourses(data || []);
        }
      } catch (error) {
        console.error('Error in fetchCourses:', error);
        toast.error('An unexpected error occurred while loading courses.');
        setErrorDetails({
          message: error.message || 'Unknown error',
          code: error.code || 'Unknown',
          hint: error.hint || 'No hint available'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const handleCreateCourse = () => {
    setShowCreateDialog(true);
  };

  const handleEditCourse = (course) => {
    setSelectedCourse(course);
    setShowEditDialog(true);
  };

  const handleDeleteCourse = (course) => {
    setSelectedCourse(course);
    setShowDeleteDialog(true);
  };

  const handleCloseDialog = () => {
    setShowCreateDialog(false);
    setShowEditDialog(false);
    setShowDeleteDialog(false);
    setSelectedCourse(null);
    setErrorDetails(null);
  };

  const handleSubmitCourse = async (formData, isEdit = false) => {
    try {
      setLoading(true);
      const courseData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        duration: formData.duration,
        level: formData.level,
        image: formData.image || null,
      };

      let result;
      if (isEdit) {
        result = await hrCourseService.updateCourse(selectedCourse.id, courseData);
      } else {
        result = await hrCourseService.createCourse(courseData);
      }

      if (result.error) {
        console.error('Error submitting course:', result.error);
        toast.error(`Failed to ${isEdit ? 'update' : 'create'} course. Please check the console for details.`);
        setErrorDetails({
          message: result.error.message,
          code: result.error.code,
          hint: result.error.hint
        });
      } else {
        toast.success(`Course ${isEdit ? 'updated' : 'created'} successfully`);
        handleCloseDialog();
        // Refresh courses
        const { data } = await hrCourseService.getCourses();
        setCourses(data || []);
      }
    } catch (error) {
      console.error('Error in handleSubmitCourse:', error);
      toast.error(`An unexpected error occurred while ${isEdit ? 'updating' : 'creating'} the course.`);
      setErrorDetails({
        message: error.message || 'Unknown error',
        code: error.code || 'Unknown',
        hint: error.hint || 'No hint available'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      setLoading(true);
      const { error } = await hrCourseService.deleteCourse(selectedCourse.id);
      if (error) {
        console.error('Error deleting course:', error);
        toast.error('Failed to delete course. Please check the console for details.');
        setErrorDetails({
          message: error.message,
          code: error.code,
          hint: error.hint
        });
      } else {
        toast.success('Course deleted successfully');
        handleCloseDialog();
        // Refresh courses
        const { data } = await hrCourseService.getCourses();
        setCourses(data || []);
      }
    } catch (error) {
      console.error('Error in handleConfirmDelete:', error);
      toast.error('An unexpected error occurred while deleting the course.');
      setErrorDetails({
        message: error.message || 'Unknown error',
        code: error.code || 'Unknown',
        hint: error.hint || 'No hint available'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <PageHeader
          title="Course Management"
          description="Manage courses offered to employees"
          button={
            <Button onClick={handleCreateCourse}>
              <Plus className="h-4 w-4 mr-2" />
              Create Course
            </Button>
          }
          backUrl={ROUTES.HR_DASHBOARD}
        />

        {errorDetails && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4 mr-2" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {errorDetails.message}
              {errorDetails.hint && (
                <div className="mt-2 text-sm">
                  <strong>Hint:</strong> {errorDetails.hint}
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="rounded-md border bg-card text-card-foreground shadow-sm">
            <DataTable columns={columns(handleEditCourse, handleDeleteCourse)} data={courses} />
          </div>
        )}

        {/* Create Course Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Course</DialogTitle>
              <DialogDescription>
                Add a new course to the system.
              </DialogDescription>
            </DialogHeader>
            <CourseForm onSubmit={(formData) => handleSubmitCourse(formData)} onCancel={handleCloseDialog} />
          </DialogContent>
        </Dialog>

        {/* Edit Course Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Course</DialogTitle>
              <DialogDescription>
                Edit details for the selected course.
              </DialogDescription>
            </DialogHeader>
            <CourseForm
              onSubmit={(formData) => handleSubmitCourse(formData, true)}
              onCancel={handleCloseDialog}
              initialData={selectedCourse}
            />
          </DialogContent>
        </Dialog>

        {/* Delete Course Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Delete Course</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this course? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="secondary" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleConfirmDelete}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default CourseManagement;
