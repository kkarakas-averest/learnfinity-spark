import React from 'react';
import useState from 'react';
import useEffect from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { Database } from '@/types/supabase';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useHRAuth } from '@/contexts/HRAuthContext';

// Define the user type based on your Supabase schema 
type UserProfile = Database['public']['Tables']['user_profiles']['Row'];

const ManageUsersPage: React.FC = () => {
  const supabase = useSupabaseClient<Database>();
  const { session } = useHRAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      setError(null);

      if (!session?.access_token) {
        setError("Authentication session not found. Cannot fetch users.");
        setIsLoading(false);
        setUsers([]);
        return;
      }

      try {
        // Call the Edge Function instead of direct query
        const { data, error: functionError } = await supabase.functions.invoke(
          'get-all-users-for-superadmin',
          {
            // Pass the authorization header implicitly via the client if configured,
            // or explicitly if needed by your function setup:
            // headers: { Authorization: `Bearer ${session.access_token}` }
            // Generally, the JS client handles this if initialized correctly.
          }
        );

        if (functionError) {
          // Handle function-specific errors (like 401, 403, 500 from the function)
          let errorMessage = functionError.message;
          try {
            // Attempt to parse potential JSON error response from the function
            const errorJson = JSON.parse(functionError.message.substring(functionError.message.indexOf('{')));
            errorMessage = errorJson.error || errorJson.details || errorMessage;
          } catch (parseError) {
             // Ignore parsing error, use original message
          }
          console.error("Edge function error details:", functionError); // Log the raw error too
          throw new Error(errorMessage);
        }

        // Ensure data has the expected structure
        if (data && Array.isArray(data.users)) {
          setUsers(data.users);
        } else {
          console.warn("Received unexpected data structure from Edge Function:", data);
          setUsers([]);
          setError("Received unexpected data from server.");
        }

      } catch (err: any) {
        console.error("Error fetching users via Edge Function:", err);
        setError(err.message || 'Failed to fetch users.');
        setUsers([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
    // Add session as dependency to refetch if session changes (though less likely here)
  }, [supabase, session]);

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Manage Users</h2>

      {isLoading && (
        <div className="flex justify-center items-center py-8">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {error && (
         <Alert variant="destructive" className="mb-4">
           <AlertTitle>Error</AlertTitle>
           <AlertDescription>{error}</AlertDescription>
         </Alert>
      )}

      {!isLoading && !error && (
        <div>
          <p className="mb-2">Total Users: {users.length}</p>
          {users.length === 0 ? (
             <p>No users found.</p>
          ) : (
            <ul className="space-y-2">
              {users.map((user: UserProfile) => (
                <li key={user.id} className="p-2 border rounded">
                  {user.email || 'No Email'} - Role: {user.role || 'Unassigned'} - 
                  Company ID: {user.company_id || 'None'}
                  {/* TODO: Add Edit/Delete buttons */}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default ManageUsersPage; 