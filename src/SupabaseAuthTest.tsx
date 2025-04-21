
import React from 'react';

const SupabaseAuthTest: React.FC = () => {
  const [user, setUser] = React.useState(null);
  
  React.useEffect(() => {
    // Check for user authentication
    console.log("Auth test component mounted");
  }, []);
  
  return (
    <div>
      <h2>Supabase Auth Test</h2>
      {user ? (
        <p>Logged in as: {user.email}</p>
      ) : (
        <p>Not logged in</p>
      )}
    </div>
  );
};

export default SupabaseAuthTest;
