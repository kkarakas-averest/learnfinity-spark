
import React from '@/lib/react-helpers';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/lib/routes';

const CourseListPage: React.FC = () => {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Courses</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <p>Course list will appear here</p>
        <div className="mt-4">
          <Link to={ROUTES.COURSE_CREATE} className="bg-primary text-white px-4 py-2 rounded hover:bg-primary/90">
            Create New Course
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CourseListPage;
