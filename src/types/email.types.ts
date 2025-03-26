export interface WelcomeEmailProps {
  firstName: string;
  credentials: {
    email: string;
    temporaryPassword: string;
  };
  learningPath: {
    title: string;
    description: string;
    estimatedDuration: string;
  };
} 