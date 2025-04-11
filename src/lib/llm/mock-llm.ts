/**
 * Mock LLM provider for testing and fallback scenarios
 */
import { LLMProvider } from './llm-service';

export class MockLLM implements LLMProvider {
  private model: string = 'mock-gpt';
  
  constructor(model?: string) {
    if (model) {
      this.model = model;
    }
  }
  
  /**
   * Always returns true as the mock provider is always configured
   */
  isConfigured(): boolean {
    return true;
  }
  
  /**
   * Get the currently configured model
   */
  getModel(): string {
    return this.model;
  }
  
  /**
   * Set the model to use
   */
  setModel(model: string): void {
    this.model = model;
  }
  
  /**
   * Generate a completion based on the input prompt
   */
  async complete(
    prompt: string,
    options: {
      temperature?: number;
      maxTokens?: number;
      system?: string;
      topP?: number;
      stopSequences?: string[];
    } = {}
  ): Promise<{
    text: string;
    usage: {
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
    };
  }> {
    // Log the request for debugging
    console.log('MockLLM: Generating completion for prompt:', prompt.substring(0, 100) + '...');
    console.log('MockLLM: Options:', options);
    
    // Simulate a delay for realism
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Generate mock length based on prompt
    const promptLength = prompt.length;
    const responseLength = Math.min(500, Math.max(100, Math.floor(promptLength * 0.7)));
    
    // Calculate mock token usage
    const promptTokens = Math.ceil(promptLength / 4);
    const completionTokens = Math.ceil(responseLength / 4);
    
    // Prepare a default mock response
    let mockResponse = "";
    
    // Generate a simple response based on the prompt context
    if (prompt.toLowerCase().includes('course') || prompt.toLowerCase().includes('learning')) {
      mockResponse = "This is a mock response for a course-related query. The LLM service is currently using a mock provider, which doesn't provide real AI-generated content. In a production environment with a valid Groq API key, you would receive an intelligent response based on your specific query about courses or learning materials.";
    } else if (prompt.toLowerCase().includes('profile') || prompt.toLowerCase().includes('employee')) {
      mockResponse = "This is a mock response for an employee profile query. The mock LLM provider is returning this pre-defined text instead of an actual AI-generated response. To get real AI-powered content, please configure a valid Groq API key in your environment.";
    } else if (prompt.toLowerCase().includes('summarize') || prompt.toLowerCase().includes('summary')) {
      mockResponse = "This is a mock summary response. The mock LLM provider is being used because no valid Groq API configuration was found. This text is a placeholder for what would normally be an AI-generated summary based on your specific query.";
    } else if (prompt.toLowerCase().includes('analyze') || prompt.toLowerCase().includes('analysis')) {
      mockResponse = "This is a mock analysis response. The LLM service is using the mock provider, which returns pre-defined text rather than performing actual analysis. For real AI-powered analysis, please ensure your Groq API key is properly configured.";
    } else if (prompt.toLowerCase().includes('recommend') || prompt.toLowerCase().includes('suggestion')) {
      mockResponse = "This is a mock recommendation response. The mock LLM provider is returning this placeholder text instead of providing actual AI-generated recommendations. To receive intelligent suggestions, please configure a valid Groq API key.";
    } else {
      mockResponse = "This is a mock response from the LLM service. The system is currently using a mock provider because no valid Groq API configuration was found or there was an error with the real provider. This text is a placeholder for what would normally be an AI-generated response tailored to your specific query.";
    }
    
    // Ensure the response is long enough to match our calculated length
    while (mockResponse.length < responseLength) {
      mockResponse += " " + mockResponse;
    }
    
    // Trim to the target length
    mockResponse = mockResponse.substring(0, responseLength);
    
    return {
      text: mockResponse,
      usage: {
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens,
        total_tokens: promptTokens + completionTokens
      }
    };
  }
}

export default MockLLM; 