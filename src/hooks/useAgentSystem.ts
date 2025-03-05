import React from "@/lib/react-helpers";
import { useState, useEffect } from "@/lib/react-helpers";

// Define the Agent interface
interface Agent {
  id: string;
  name: string;
  status: "online" | "offline" | "busy";
  skills: string[];
}

// Custom hook for managing agent system
export const useAgentSystem = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Simulate fetching agents from an API
    const fetchAgents = async () => {
      try {
        // Simulate API call delay
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const mockAgents: Agent[] = [
          {
            id: "1",
            name: "Alice",
            status: "online",
            skills: ["javascript", "react", "node"],
          },
          {
            id: "2",
            name: "Bob",
            status: "busy",
            skills: ["python", "data analysis", "machine learning"],
          },
          {
            id: "3",
            name: "Charlie",
            status: "offline",
            skills: ["design", "ui/ux", "figma"],
          },
        ];

        setAgents(mockAgents);
        setLoading(false);
      } catch (err: Error | unknown) {
        const errorMessage = err instanceof Error ? err.message : "Failed to fetch agents";
        setError(errorMessage);
        setLoading(false);
      }
    };

    fetchAgents();
  }, []);

  // Function to update agent status
  const updateAgentStatus = (agentId: string, newStatus: Agent["status"]) => {
    setAgents((prevAgents) =>
      prevAgents.map((agent) =>
        agent.id === agentId ? { ...agent, status: newStatus } : agent
      )
    );
  };

  return {
    agents,
    loading,
    error,
    updateAgentStatus,
  };
};
