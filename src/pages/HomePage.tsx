
import React from '@/lib/react-helpers';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/lib/routes';

const HomePage: React.FC = () => {
  return (
    <div className="container mx-auto p-6 text-center">
      <h1 className="text-4xl font-bold mb-6">Welcome to Learnfinity</h1>
      <p className="text-xl mb-8">
        An AI-powered Learning Management System for employee onboarding and personalized training
      </p>
      
      <div className="flex justify-center space-x-4">
        <Link 
          to={ROUTES.LOGIN} 
          className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90"
        >
          Login as Learner
        </Link>
        <Link 
          to={ROUTES.HR_LOGIN} 
          className="bg-secondary text-primary px-6 py-3 rounded-lg hover:bg-secondary/90"
        >
          HR Admin Login
        </Link>
      </div>
    </div>
  );
};

export default HomePage;
