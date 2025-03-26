
import React from '@/lib/react-helpers';
import { useParams } from 'react-router-dom';

const CourseDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Course Details</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <p>Course details for ID: {id}</p>
      </div>
    </div>
  );
};

export default CourseDetailsPage;
