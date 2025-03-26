
import * as React from 'react';
import { useState, useEffect } from '@/lib/react-helpers';
import { supabase } from './lib/supabase';

const SupabaseAuthTest = () => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        setUser(data.user);
      } catch (error) {
        console.error("Error fetching user:", error);
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Supabase Auth Test</h2>
      {loading ? (
        <p>Loading...</p>
      ) : user ? (
        <div>
          <p className="text-green-600">✅ Authenticated as: {user.email}</p>
          <pre className="mt-2 p-2 bg-gray-100 rounded">
            {JSON.stringify(user, null, 2)}
          </pre>
        </div>
      ) : (
        <p className="text-red-600">❌ Not authenticated</p>
      )}
    </div>
  );
};

export default SupabaseAuthTest;
