
import React, { useState, useEffect } from 'react';

const SupabaseAuthTest = () => {
  const [user, setUser] = useState(null);
  
  useEffect(() => {
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
