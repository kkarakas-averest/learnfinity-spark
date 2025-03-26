
import React from '@/lib/react-helpers';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/lib/routes';

const NotFoundPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
      <h1 className="text-6xl font-bold mb-4">404</h1>
      <h2 className="text-2xl font-semibold mb-6">Page Not Found</h2>
      <p className="mb-8 text-gray-600 max-w-md">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link 
        to={ROUTES.HOME}
        className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 transition-colors"
      >
        Return Home
      </Link>
    </div>
  );
};

export default NotFoundPage;
