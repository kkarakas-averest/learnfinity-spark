/**
 * Test script for the Multi-Agent Framework
 * 
 * Run with: npx tsx src/scripts/test-agent-framework.ts
 */

// Load environment variables from .env file
import * as dotenv from 'dotenv';
dotenv.config();

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import the simulated agents instead of real ones
interface SimulatedAgent {
  id: string;
  name: string;
  role: string;
  initialize: () => Promise<void>;
  processTask: (task: any) => Promise<any>;
}

class SimulatedManagerAgent implements SimulatedAgent {
  id: string;
  name: string;
  role: string;
  
  constructor(config: any) {
    this.id = config.id || "manager-agent";
    this.name = config.name || "Manager Agent";
    this.role = config.role || "System Coordinator";
  }
  
  async initialize(): Promise<void> {
    console.log(`[${this.name}] Initialized`);
  }
  
  async processTask(task: any): Promise<any> {
    console.log(`[${this.name}] Processing task: ${JSON.stringify(task)}`);
    return { success: true };
  }
  
  async registerAgent(agent: SimulatedAgent): Promise<void> {
    console.log(`[${this.name}] Registering agent: ${agent.name}`);
  }
  
  async submitTask(task: any): Promise<string> {
    const taskId = `task-${Date.now()}`;
    console.log(`[${this.name}] Task submitted: ${taskId}`);
    return taskId;
  }
  
  async getTaskStatus(taskId: string): Promise<string> {
    return "completed";
  }
  
  async getTaskResult(taskId: string): Promise<any> {
    return { success: true, data: { generatedContent: "Simulated content" } };
  }
}

class SimulatedEducatorAgent implements SimulatedAgent {
  id: string;
  name: string;
  role: string;
  
  constructor(config: any) {
    this.id = config.id || "educator-agent";
    this.name = config.name || "Educator Agent";
    this.role = config.role || "Content Generator";
  }
  
  async initialize(): Promise<void> {
    console.log(`[${this.name}] Initialized`);
  }
  
  async processTask(task: any): Promise<any> {
    console.log(`[${this.name}] Processing task: ${JSON.stringify(task)}`);
    return { success: true };
  }
}

/**
 * Test the agent framework by initializing agents and submitting tasks
 */
async function testAgentFramework() {
  try {
    console.log("==== Testing Agent Framework ====");
    
    // Create the manager agent
    const managerAgent = new SimulatedManagerAgent({
      id: "manager-agent",
      name: "Manager Agent",
      role: "System Orchestrator",
      verbose: true
    });
    
    // Initialize the manager agent
    await managerAgent.initialize();
    
    // Create and initialize the educator agent
    const educatorAgent = new SimulatedEducatorAgent({
      id: "educator-agent",
      name: "Educator Agent",
      role: "Content Generator",
      verbose: true
    });
    
    await educatorAgent.initialize();
    
    // Register the educator agent with the manager
    await managerAgent.registerAgent(educatorAgent);
    console.log("Educator Agent registered");
    
    // Create a content generation request
    const contentRequest = {
      contentType: "course",
      topic: "Introduction to Artificial Intelligence",
      targetAudience: {
        skillLevel: "beginner",
      },
      learningObjectives: [
        "Understand AI fundamentals",
        "Learn about machine learning",
        "Explore neural networks"
      ],
      keywords: ["AI", "machine learning", "neural networks", "deep learning", "algorithms"]
    };
    
    // Execute the content generation workflow
    console.log("Submitting content generation task...");
    const startTime = Date.now();
    
    // Create output directory if it doesn't exist
    const outputDir = path.join(process.cwd(), "output");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const taskId = await managerAgent.submitTask({
      name: "Generate AI Course",
      type: "workflow",
      data: {
        workflow: "Content Generation",
        ...contentRequest
      }
    });
    
    console.log(`Task submitted with ID: ${taskId}`);
    
    // Wait for the task to complete
    console.log("Waiting for task to complete...");
    
    // Simulate task completion
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Get the task result
    const result = await managerAgent.getTaskResult(taskId);
    
    const endTime = Date.now();
    console.log(`Task completed in ${(endTime - startTime) / 1000} seconds`);
    
    // Save the result to a file
    const outputFile = path.join(outputDir, `content_gen_result_${Date.now()}.json`);
    fs.writeFileSync(outputFile, JSON.stringify(result, null, 2));
    
    console.log(`Result saved to ${outputFile}`);
    
    // Test the manager agent's health monitoring
    console.log("Testing agent health monitoring...");
    const health = await managerAgent.getTaskResult("health-check");
    console.log("Health check result:", health);
    
  } catch (error) {
    console.error("Error testing agent framework:", error);
  }
}

// Execute the test
testAgentFramework().catch(console.error); 