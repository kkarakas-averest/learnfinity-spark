import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from "@/components/ThemeProvider";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from "@/components/ui/toaster";

// Import our new StateProvider instead of the old AuthProvider
import { StateProvider } from '@/state';

import App from './App';
import './index.css';

// Create a query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        {/* Use our new StateProvider that includes authentication, HR authentication,
            user state, courses state, and UI state all in one */}
        <StateProvider>
          {/* Keep the ThemeProvider inside StateProvider so we can potentially
              control theme via our UI state in the future */}
          <ThemeProvider defaultTheme="light" storageKey="ui-theme">
            <App />
            <Toaster />
          </ThemeProvider>
        </StateProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>
); 