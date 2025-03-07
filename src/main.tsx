import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from "@/components/ThemeProvider";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from "@/components/ui/toaster";
import { StateProvider } from '@/state';
import App from './App';
import './index.css';

// Debug log for main render
console.log("Main rendering started");

// Create a query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

// Debug wrapper for StateProvider to ensure single instance
const SingletonStateProvider = ({children}: {children: React.ReactNode}) => {
  console.log("StateProvider rendering");
  return <StateProvider>{children}</StateProvider>;
};

// Completely remove StrictMode to prevent double renders
ReactDOM.createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <QueryClientProvider client={queryClient}>
      <SingletonStateProvider>
        <ThemeProvider defaultTheme="light" storageKey="ui-theme">
          <App />
          <Toaster />
        </ThemeProvider>
      </SingletonStateProvider>
    </QueryClientProvider>
  </BrowserRouter>
);
