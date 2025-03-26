
import React from '@/lib/react-helpers';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/lib/routes';

const NotFoundPage: React.FC = () => {
  return (
    <div className="container mx-auto p-6 text-center">
      <h1 className="text-4xl font-bold mb-6">404 - Page Not Found</h1>
      <p className="text-xl mb-8">
        The page you are looking for does not exist or has been moved.
      </p>
      
      <Link 
        to={ROUTES.HOME} 
        className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90"
      >
        Return to Home
      </Link>
    </div>
  );
};

export default NotFoundPage;
