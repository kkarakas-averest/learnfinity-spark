/**
 * useAgentSystem Hook
 * 
 * A React hook for interacting with the Multi-Agent System from components.
 * This provides a simple interface for React components to leverage the agent system,
 * with status tracking and loading states.
 */

import React from "@/lib/react-helpers";
import { useState, useEffect, useCallback } from "@/lib/react-helpers";
import { AgentFactory } from '@/agents/AgentFactory';

interface UseAgentSystemOptions {
  debug?: boolean;
  autoInitialize?: boolean;
}

interface UseAgentSystemReturn {
  isInitialized: boolean;
  isInitializing: boolean;
  initError: string | null;
  initialize: () => Promise<void>;
  isProcessing: boolean;
  determineRAGStatus: (employeeData: any) => Promise<any>;
  generateLearningPath: (employeeId: string, preferences: any) => Promise<any>;
  checkEmployeeStatus: (employeeId: string) => Promise<any>;
  sendNotification: (recipientId: string, title: string, message: string, actionLink?: string) => Promise<any>;
  createIntervention: (employeeId: string, type: string, content: string, notes?: string) => Promise<any>;
  cleanup: () => void;
}

export function useAgentSystem(options: UseAgentSystemOptions = {}): UseAgentSystemReturn {
  const { debug = false, autoInitialize = true } = options;
  
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [isInitializing, setIsInitializing] = useState<boolean>(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  
  const factory = AgentFactory.getInstance();
  
  // Initialize the agent system
  const initialize = useCallback(async () => {
    if (isInitialized || isInitializing) return;
    
    setIsInitializing(true);
    setInitError(null);
    
    try {
      await factory.initializeRAGCrew(debug);
      setIsInitialized(true);
    } catch (error) {
      console.error('Failed to initialize agent system:', error);
      setInitError(error instanceof Error ? error.message : 'Unknown error initializing agent system');
    } finally {
      setIsInitializing(false);
    }
  }, [debug, isInitialized, isInitializing, factory]);
  
  // Auto-initialize on mount if enabled
  useEffect(() => {
    if (autoInitialize) {
      initialize();
    }
    
    // Cleanup on unmount
    return () => {
      factory.cleanup();
    };
  }, [autoInitialize, initialize, factory]);
  
  // Determine RAG status for an employee
  const determineRAGStatus = useCallback(async (employeeData: any) => {
    if (!isInitialized) {
      throw new Error('Agent system must be initialized before use');
    }
    
    setIsProcessing(true);
    
    try {
      return await factory.determineRAGStatus(employeeData);
    } finally {
      setIsProcessing(false);
    }
  }, [isInitialized, factory]);
  
  // Generate learning path for an employee
  const generateLearningPath = useCallback(async (employeeId: string, preferences: any) => {
    if (!isInitialized) {
      throw new Error('Agent system must be initialized before use');
    }
    
    setIsProcessing(true);
    
    try {
      return await factory.manageLearningPath(employeeId, preferences.currentStatus || 'amber', preferences);
    } finally {
      setIsProcessing(false);
    }
  }, [isInitialized, factory]);
  
  // Check employee status
  const checkEmployeeStatus = useCallback(async (employeeId: string) => {
    if (!isInitialized) {
      throw new Error('Agent system must be initialized before use');
    }
    
    setIsProcessing(true);
    
    try {
      return await factory.checkEmployeeStatus(employeeId);
    } finally {
      setIsProcessing(false);
    }
  }, [isInitialized, factory]);
  
  // Send notification
  const sendNotification = useCallback(async (
    recipientId: string, 
    title: string, 
    message: string, 
    actionLink?: string
  ) => {
    if (!isInitialized) {
      throw new Error('Agent system must be initialized before use');
    }
    
    setIsProcessing(true);
    
    try {
      return await factory.sendNotification(recipientId, title, message, actionLink);
    } finally {
      setIsProcessing(false);
    }
  }, [isInitialized, factory]);
  
  // Create intervention
  const createIntervention = useCallback(async (
    employeeId: string, 
    type: string, 
    content: string, 
    notes?: string
  ) => {
    if (!isInitialized) {
      throw new Error('Agent system must be initialized before use');
    }
    
    setIsProcessing(true);
    
    try {
      return await factory.createIntervention(employeeId, type, content, notes);
    } finally {
      setIsProcessing(false);
    }
  }, [isInitialized, factory]);
  
  // Cleanup function
  const cleanup = useCallback(() => {
    factory.cleanup();
    setIsInitialized(false);
  }, [factory]);
  
  return {
    isInitialized,
    isInitializing,
    initError,
    initialize,
    isProcessing,
    determineRAGStatus,
    generateLearningPath,
    checkEmployeeStatus,
    sendNotification,
    createIntervention,
    cleanup
  };
}
