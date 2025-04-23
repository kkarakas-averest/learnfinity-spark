
import React from '@/lib/react-helpers';
import { Navigate, useLocation } from 'react-router-dom';
import { ROUTES } from '@/lib/routes';
import { useHRAuth } from '@/state/hrAuth/useHRAuth';
import { Loader2 } from "lucide-react";
import { supabase } from '@/lib/supabase';

interface HRProtectedRouteProps {
  children: React.ReactNode;
}

const HRProtectedRoute: React.FC<HRProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useHRAuth();
  const [roleVerified, setRoleVerified] = React.useState<boolean | null>(null);
  const location = useLocation();

  React.useEffect(() => {
    const verifyHRRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setRoleVerified(false);
          return;
        }

        const { data: profile } = await supabase
          .from('user_profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        setRoleVerified(profile?.role === 'hr');
      } catch (error) {
        console.error('Role verification error:', error);
        setRoleVerified(false);
      }
    };

    verifyHRRole();
  }, []);
  
  if (isLoading || roleVerified === null) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-sm text-muted-foreground">Verifying access...</p>
      </div>
    );
  }
  
  if (!isAuthenticated || !roleVerified) {
    return <Navigate to={ROUTES.HR_LOGIN} state={{ from: location }} replace />;
  }
  
  return <>{children}</>;
};

export default HRProtectedRoute;
