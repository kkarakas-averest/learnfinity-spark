'use client';

import { createContext, useContext, useState, useEffect } from '@/lib/react-helpers';
import React from '@/lib/react-helpers';
import { SupabaseClient } from '@supabase/supabase-js';
import { supabase as supabaseClient } from '@/lib/supabase';

type SupabaseContextType = {
  supabase: SupabaseClient;
};

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined);

export function SupabaseProvider({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  const [supabase] = useState(() => supabaseClient);
  
  return (
    <SupabaseContext.Provider value={{ supabase }}>
      {children}
    </SupabaseContext.Provider>
  );
}

export const useSupabase = () => {
  const context = useContext(SupabaseContext);
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context;
}; 