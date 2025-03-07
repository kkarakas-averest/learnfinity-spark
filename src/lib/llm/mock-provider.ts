/**
 * MockLLMProvider
 * 
 * A mock implementation of an LLM provider for testing purposes.
 * This provider returns predefined responses for different prompt types
 * without making actual API calls.
 */

import { LLMProvider } from './llm-service';

// Token usage simulation constants
const TOKENS_PER_CHAR = 0.25;
const MIN_COMPLETION_TOKENS = 20;

/**
 * MockLLMProvider class for testing without API calls
 */
export class MockLLMProvider implements LLMProvider {
  private debug: boolean;
  private model: string;
  
  constructor(model: string = 'mock-model', debug: boolean = false) {
    this.model = model;
    this.debug = debug;
    
    if (debug) {
      console.log('MockLLMProvider initialized. This is for testing only!');
    }
  }
  
  /**
   * Generate a mock completion response
   */
  async complete(
    prompt: string,
    options: {
      temperature?: number,
      maxTokens?: number,
      system?: string,
      topP?: number,
      stopSequences?: string[]
    } = {}
  ): Promise<{ text: string, usage: { prompt_tokens: number, completion_tokens: number, total_tokens: number } }> {
    // Log the request if debug is enabled
    if (this.debug) {
      console.log('MockLLMProvider received prompt:', {
        promptLength: prompt.length,
        system: options.system?.substring(0, 50) + '...',
        options
      });
    }
    
    // Simulate a slight delay to mimic API call
    await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 700));
    
    // Calculate simulated token usage
    const promptTokens = Math.ceil(prompt.length * TOKENS_PER_CHAR);
    
    // Determine the most appropriate mock response based on the prompt content
    const response = this.determineResponse(prompt, options.system || '');
    const completionTokens = Math.max(
      Math.ceil(response.length * TOKENS_PER_CHAR),
      MIN_COMPLETION_TOKENS
    );
    
    // Track usage
    const usage = {
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      total_tokens: promptTokens + completionTokens
    };
    
    if (this.debug) {
      console.log('MockLLMProvider returning response:', {
        responseLength: response.length,
        usage
      });
    }
    
    return {
      text: response,
      usage
    };
  }
  
  /**
   * Return an appropriate mock response based on the prompt content
   */
  private determineResponse(prompt: string, system: string): string {
    // Normalize the prompt and system message for easier matching
    const normalizedPrompt = prompt.toLowerCase();
    const normalizedSystem = system.toLowerCase();
    
    // Check for RAG status determination
    if (
      normalizedPrompt.includes('rag status') || 
      normalizedPrompt.includes('determine status') ||
      normalizedSystem.includes('rag') || 
      normalizedSystem.includes('red/amber/green')
    ) {
      return this.mockRAGStatusResponse(normalizedPrompt);
    }
    
    // Check for learning path generation
    if (
      normalizedPrompt.includes('learning path') || 
      normalizedPrompt.includes('course recommendation') ||
      normalizedSystem.includes('personalized learning')
    ) {
      return this.mockLearningPathResponse(normalizedPrompt);
    }
    
    // Check for content creation
    if (
      normalizedPrompt.includes('create content') || 
      normalizedPrompt.includes('remedial material') ||
      normalizedSystem.includes('content creation')
    ) {
      return this.mockContentCreationResponse(normalizedPrompt);
    }
    
    // Default response for unrecognized prompts
    return `
      This is a mock response from the testing provider.
      Your prompt didn't match any specialized categories, so I'm providing this generic response.
      In a real implementation, I would generate a thoughtful response based on your specific query:
      "${prompt.substring(0, 100)}${prompt.length > 100 ? '...' : ''}"
    `.trim();
  }
  
  /**
   * Generate a mock RAG status response
   */
  private mockRAGStatusResponse(prompt: string): string {
    // Check the prompt to decide which status to return
    let status: 'RED' | 'AMBER' | 'GREEN';
    
    if (
      prompt.includes('poor performance') || 
      prompt.includes('missed deadline') || 
      prompt.includes('inactive') ||
      prompt.includes('low completion')
    ) {
      status = 'RED';
    } else if (
      prompt.includes('moderate') || 
      prompt.includes('some delay') || 
      prompt.includes('average') ||
      prompt.includes('partially')
    ) {
      status = 'AMBER';
    } else {
      status = 'GREEN';
    }
    
    // Return appropriate response
    switch (status) {
      case 'RED':
        return `
          Status: RED

          This employee requires immediate intervention. Their progress metrics show significant issues:
          - Low completion rate (below 30%)
          - Extended inactivity period (more than 30 days)
          - Multiple missed deadlines

          Recommended actions:
          1. Schedule a direct one-on-one meeting to discuss blockers
          2. Consider adjusting the learning plan to be more manageable
          3. Provide additional support resources
          4. Set up more frequent check-ins to monitor progress
        `.trim();
      case 'AMBER':
        return `
          Status: AMBER

          This employee needs attention. Their progress metrics show moderate concerns:
          - Completion rate between 30-60%
          - Some inactivity (10-20 days)
          - Occasional missed deadlines

          Recommended actions:
          1. Send a check-in message to offer assistance
          2. Highlight upcoming deadlines and important modules
          3. Consider providing supplementary resources for difficult topics
          4. Monitor progress more closely over the next two weeks
        `.trim();
      case 'GREEN':
        return `
          Status: GREEN

          This employee is progressing well. Their metrics show positive engagement:
          - Good completion rate (above 70%)
          - Regular activity (active within the past week)
          - Meeting deadlines consistently

          Recommended actions:
          1. Provide positive reinforcement
          2. Continue regular monitoring
          3. Consider offering advanced or bonus material if they're interested
        `.trim();
    }
  }
  
  /**
   * Generate a mock learning path response
   */
  private mockLearningPathResponse(prompt: string): string {
    return `
      # Personalized Learning Path Recommendation

      Based on the employee's profile and learning history, here's a recommended learning path:

      ## Core Focus Areas
      1. **Data Analysis Fundamentals** - 4 weeks
         - Introduction to SQL (2 days)
         - Data Visualization Principles (3 days)
         - Statistical Analysis Basics (1 week)
         - Practical Data Interpretation (1 week)

      2. **Project Management Skills** - 3 weeks
         - Agile Methodology Overview (1 week)
         - Time Management and Prioritization (3 days)
         - Collaborative Tools Workshop (2 days)
         - Problem-Solving Techniques (1 week)

      ## Recommended Schedule
      - Complete 1-2 modules per week
      - Allocate 3-5 hours weekly for learning activities
      - Schedule practice sessions every Friday

      ## Additional Resources
      - Recommended mentorship with Sarah from Data Team
      - Suggested participation in the monthly Analytics Workshop
      - Access to the premium Learning Library for practical examples

      This path is designed to address the identified knowledge gaps while building on existing strengths. The pace is set to accommodate current workload while ensuring steady progress.
    `.trim();
  }
  
  /**
   * Generate a mock content creation response
   */
  private mockContentCreationResponse(prompt: string): string {
    return `
      # Remedial Learning Module: Data Visualization Fundamentals

      ## Module Overview
      This learning module is designed to address knowledge gaps in data visualization principles and best practices, specifically focusing on chart selection and effective visualization design.

      ## Learning Objectives
      By the end of this module, you will be able to:
      - Determine the appropriate chart type for different data scenarios
      - Apply design principles to create clear and effective visualizations
      - Avoid common data visualization pitfalls
      - Interpret complex visualizations correctly

      ## Module Content

      ### Section 1: Chart Selection Framework
      **Visual Exercise: Chart Matching**
      Match each dataset scenario with the most appropriate visualization type:
      - Time series data → Line charts
      - Part-to-whole relationships → Pie or donut charts
      - Ranking data → Bar charts
      - Distribution analysis → Histograms or box plots

      **Practice Activity:**
      Review the following dataset descriptions and select the most appropriate visualization:
      1. Monthly sales figures for the past year
      2. Department budget allocation
      3. Customer satisfaction scores by product
      4. Age distribution of employees

      ### Section 2: Design Principles for Clarity
      **Key Concepts:**
      - Data-ink ratio - Maximizing meaningful information
      - Color usage - Strategic use of color for emphasis
      - Labeling best practices - When and how to use annotations

      **Interactive Example:**
      Improve the provided visualization by applying these principles.

      ### Section 3: Learning Check
      Answer the following questions to assess your understanding:
      1. What visualization would be best for showing the relationship between employee tenure and performance scores?
      2. When is a stacked bar chart more appropriate than a grouped bar chart?
      3. What design changes would you make to improve this example dashboard?

      ## Additional Resources
      - Quick Reference Guide: "Chart Selection Decision Tree"
      - Video Tutorial: "Common Visualization Mistakes and How to Fix Them"
      - Practice Dataset: "Sales Performance by Region"

      This module is designed with your visual learning preference in mind, providing multiple examples and hands-on activities to reinforce concepts.
    `.trim();
  }
  
  /**
   * Check if the provider is configured (always true for mock)
   */
  isConfigured(): boolean {
    return true;
  }
  
  /**
   * Get the model being used
   */
  getModel(): string {
    return this.model;
  }
  
  /**
   * Set the model to use
   */
  setModel(model: string): void {
    this.model = model;
    if (this.debug) {
      console.log(`Mock model changed to: ${this.model}`);
    }
  }
} 