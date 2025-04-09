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
 * MockLLMProvider for development and testing purposes
 * 
 * This provides a mock implementation of the LLM provider interface
 * that returns predefined responses for testing without API calls.
 */
export class MockLLMProvider implements LLMProvider {
  private model: string;
  private debug: boolean;
  
  constructor(model: string = 'mock-llm', debug: boolean = false) {
    this.model = model;
    this.debug = debug;
    if (debug) {
      console.log('Using MockLLMProvider for testing');
    }
  }
  
  public isConfigured(): boolean {
    return true; // Mock provider is always configured
  }
  
  public getModel(): string {
    return this.model;
  }
  
  public setModel(model: string): void {
    this.model = model;
    if (this.debug) {
      console.log(`Mock model set to: ${model}`);
    }
  }
  
  public async complete(
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
    // Log prompt and options if debug is enabled
    if (this.debug) {
      console.log('Mock LLM request:', {
        prompt: prompt.substring(0, 100) + (prompt.length > 100 ? '...' : ''),
        options
      });
    }
    
    // Calculate mock token counts
    const promptTokens = Math.ceil(prompt.length / 4);
    const responseTokens = 150 + Math.floor(Math.random() * 100);
    
    // Generate a deterministic but context-aware mock response
    let response: string;
    
    // Basic keyword matching for different types of prompts
    if (prompt.includes('learning path')) {
      response = this.getMockLearningPath();
    } else if (prompt.includes('RAG') || prompt.includes('status analysis')) {
      response = this.getMockRAGAnalysis();
    } else if (prompt.includes('profile')) {
      response = this.getMockProfile();
    } else if (prompt.includes('intervention') || prompt.includes('recommendation')) {
      response = this.getMockIntervention();
    } else if (prompt.includes('content')) {
      response = this.getEducationalContent(prompt);
    } else {
      response = this.getGenericResponse();
    }
    
    // Simulate processing time (100ms-300ms)
    const delay = 100 + Math.floor(Math.random() * 200);
    await new Promise(resolve => setTimeout(resolve, delay));
    
    return {
      text: response,
      usage: {
        prompt_tokens: promptTokens,
        completion_tokens: responseTokens,
        total_tokens: promptTokens + responseTokens
      }
    };
  }
  
  private getMockLearningPath(): string {
    return JSON.stringify({
      "id": "lp-mock-" + Date.now(),
      "title": "Professional Development Learning Path",
      "description": "A comprehensive learning path designed to build core skills and expertise.",
      "duration": "12 weeks",
      "objectives": ["Master key concepts", "Develop practical skills", "Build portfolio projects"],
      "modules": [
        {
          "id": "module-1",
          "title": "Core Fundamentals",
          "description": "Essential concepts and foundation knowledge",
          "duration": "3 weeks",
          "content": [],
          "assessments": []
        },
        {
          "id": "module-2",
          "title": "Practical Applications",
          "description": "Applying concepts to real-world scenarios",
          "duration": "5 weeks",
          "content": [],
          "assessments": []
        },
        {
          "id": "module-3",
          "title": "Advanced Techniques",
          "description": "Mastering advanced methods and approaches",
          "duration": "4 weeks",
          "content": [],
          "assessments": []
        }
      ],
      "createdAt": new Date().toISOString(),
      "updatedAt": new Date().toISOString(),
      "status": "published",
      "difficulty": "intermediate",
      "category": "Professional Development",
      "author": "Learnfinity AI"
    }, null, 2);
  }
  
  private getMockRAGAnalysis(): string {
    const statuses = ['RED', 'AMBER', 'GREEN'];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
    
    return `
## RAG STATUS: ${randomStatus}

### Justification
${randomStatus === 'RED' 
  ? 'The employee has shown low engagement and completion rates, with extended periods of inactivity.'
  : randomStatus === 'AMBER'
    ? 'The employee is making moderate progress but has inconsistent engagement patterns.' 
    : 'The employee is making excellent progress with consistent engagement and high completion rates.'}

### Key Metrics Analysis
- Progress Rate: ${randomStatus === 'RED' ? '25%' : randomStatus === 'AMBER' ? '55%' : '85%'} completion
- Engagement: ${randomStatus === 'RED' ? 'Low' : randomStatus === 'AMBER' ? 'Moderate' : 'High'} with ${randomStatus === 'RED' ? '30+' : randomStatus === 'AMBER' ? '15-20' : '< 7'} days since last activity
- Performance: ${randomStatus === 'RED' ? 'Below expectations' : randomStatus === 'AMBER' ? 'Meeting basic requirements' : 'Exceeding expectations'}
- Comparative Standing: ${randomStatus === 'RED' ? 'Bottom 25%' : randomStatus === 'AMBER' ? 'Middle 50%' : 'Top 25%'} of department

### Recommended Actions
1. ${randomStatus === 'RED' 
    ? 'Schedule an immediate check-in meeting to address barriers' 
    : randomStatus === 'AMBER' 
      ? 'Provide additional resources for challenging topics'
      : 'Recognize achievements and offer advanced learning opportunities'}
2. ${randomStatus === 'RED'
    ? 'Adjust learning path complexity or timeline'
    : randomStatus === 'AMBER'
      ? 'Set up regular progress check-ins'
      : 'Consider for mentorship opportunities'}
3. ${randomStatus === 'RED'
    ? 'Consider assigning a peer mentor'
    : randomStatus === 'AMBER'
      ? 'Highlight upcoming deadlines and milestones'
      : 'Explore new skill development areas of interest'}

### Follow-up Timeline
${randomStatus === 'RED'
  ? 'Immediate follow-up within 48 hours, with weekly check-ins thereafter'
  : randomStatus === 'AMBER'
    ? 'Follow up within one week, with bi-weekly check-ins'
    : 'Regular monthly check-ins to maintain momentum'}
`;
  }
  
  private getMockProfile(): string {
    return JSON.stringify({
      "professionalSummary": "Experienced professional with a strong background in their field and a track record of success in similar roles.",
      "skillLevel": "intermediate",
      "skillGaps": ["advanced communication", "leadership", "strategic planning"],
      "strengths": ["technical knowledge", "problem-solving", "attention to detail"],
      "learningStyle": "visual",
      "recommendedLearningAreas": [
        "leadership development",
        "strategic thinking",
        "communication skills"
      ],
      "estimatedTimeAvailability": {
        "weeklyHours": 5,
        "preferredTimes": ["mornings", "weekends"]
      },
      "careerGoals": [
        "advance to senior position",
        "develop management skills",
        "expand technical expertise"
      ]
    }, null, 2);
  }
  
  private getMockIntervention(): string {
    return JSON.stringify({
      "type": "medium_priority",
      "actions": [
        {
          "type": "schedule_meeting",
          "description": "Schedule a check-in meeting with the employee",
          "details": "Discuss current progress and identify any challenges"
        },
        {
          "type": "provide_resources",
          "description": "Provide additional learning resources",
          "resources": [
            { "id": "res-1", "name": "Video tutorial", "url": "https://example.com/tutorial" },
            { "id": "res-2", "name": "Practice exercises", "url": "https://example.com/exercises" }
          ]
        },
        {
          "type": "adjust_timeline",
          "description": "Consider adjusting the learning path timeline",
          "details": "Extend deadline by 2 weeks to allow for more practice time"
        }
      ],
      "message": "Based on the employee's learning history and current status, we recommend a medium priority intervention to address engagement gaps and provide additional support."
    }, null, 2);
  }
  
  private getMockContent(): string {
    return JSON.stringify({
      "title": "Introduction to Key Concepts",
      "description": "A foundational overview of essential concepts and principles",
      "sections": [
        {
          "title": "Core Principles",
          "content": "Here we explore the fundamental principles that underpin this subject area.",
          "examples": [
            "Example 1: A practical demonstration of the first principle in action",
            "Example 2: How this concept applies in real-world scenarios"
          ]
        },
        {
          "title": "Practical Applications",
          "content": "This section covers how to apply these concepts in practical situations.",
          "activities": [
            "Activity 1: Problem-solving exercise",
            "Activity 2: Group discussion prompt"
          ]
        }
      ],
      "assessments": [
        {
          "type": "quiz",
          "questions": [
            {
              "question": "What is the primary purpose of this concept?",
              "options": ["Option A", "Option B", "Option C", "Option D"],
              "answer": "Option B"
            },
            {
              "question": "How would you apply this in a real-world scenario?",
              "type": "open_ended"
            }
          ]
        }
      ],
      "resources": [
        {
          "title": "Further Reading",
          "type": "article",
          "url": "https://example.com/article"
        },
        {
          "title": "Video Tutorial",
          "type": "video",
          "url": "https://example.com/video"
        }
      ]
    }, null, 2);
  }
  
  /**
   * Create a properly structured educational content response
   * Specifically for course sections and educational content
   */
  private getEducationalContent(prompt: string): string {
    // Parse topic from prompt
    const topicMatch = prompt.match(/Topic:\s*([^\n]+)/);
    const topic = topicMatch ? topicMatch[1].trim() : 'Course Topic';
    
    // Determine if this is a course content request
    const isCourseContent = prompt.toLowerCase().includes('educational content') || 
                           prompt.toLowerCase().includes('learning content') ||
                           prompt.toLowerCase().includes('course');
    
    if (isCourseContent) {
      // Important: Response structure must match exactly what CourseContentService.generateAIPersonalizedContent expects
      return JSON.stringify({
        title: `Content about ${topic}`,
        content: `# ${topic}\n\nThis is mock content about ${topic} generated for intermediate level learners.`,
        mainContent: `# ${topic}\n\nThis is the main content for ${topic}. It contains comprehensive information about the subject matter.`,
        sections: [
          {
            title: "Introduction",
            content: `<h2>Introduction to ${topic}</h2><p>This section introduces the fundamental concepts of ${topic} and establishes the groundwork for deeper understanding.</p><ul><li>Key concept 1</li><li>Key concept 2</li><li>Key concept 3</li></ul>`
          },
          {
            title: "Core Principles",
            content: `<h2>Core Principles of ${topic}</h2><p>This section covers the essential principles that form the foundation of ${topic}.</p><p>These principles are applicable across various scenarios and contexts.</p>`
          },
          {
            title: "Practical Applications",
            content: `<h2>Practical Applications of ${topic}</h2><p>This section demonstrates how to apply the concepts of ${topic} in real-world situations.</p><p>Case studies and examples illustrate the practical value of these concepts.</p>`
          },
          {
            title: "Advanced Concepts",
            content: `<h2>Advanced Concepts in ${topic}</h2><p>This section explores more sophisticated aspects of ${topic} for those who have mastered the basics.</p><p>Advanced techniques and strategies are discussed in detail.</p>`
          },
          {
            title: "Summary and Next Steps",
            content: `<h2>Summary and Next Steps</h2><p>This section summarizes the key points covered in ${topic} and suggests further areas of study.</p><p>Recommended resources and practice exercises are provided.</p>`
          }
        ],
        quiz: {
          questions: [
            {
              question: `What is the primary focus of ${topic}?`,
              options: ["Option A", "Option B", "Option C", "Option D"],
              correctAnswer: 1,
              explanation: "Explanation for the correct answer"
            },
            {
              question: `How can ${topic} be applied in a professional setting?`,
              options: ["Option A", "Option B", "Option C", "Option D"],
              correctAnswer: 2,
              explanation: "Explanation for the correct answer"
            },
            {
              question: `What are the key principles of ${topic}?`,
              options: ["Option A", "Option B", "Option C", "Option D"],
              correctAnswer: 0,
              explanation: "Explanation for the correct answer"
            }
          ]
        },
        format: 'markdown',
        metadata: {
          generatedAt: new Date().toISOString(),
          model: "mock-model",
          version: "1.0",
          tokensUsed: 500,
          generationParams: {
            mockGenerated: true
          }
        },
        suggestedNextSteps: [
          "Review related materials",
          "Practice with exercises",
          "Apply concepts to real-world scenarios"
        ],
        relatedTopics: [
          `${topic} fundamentals`,
          `Advanced ${topic}`,
          `${topic} in practice`
        ],
        summary: `This is a summary of the content about ${topic}.`
      });
    }
    
    // Default to the regular mock content response
    return this.getMockContent();
  }
  
  private getGenericResponse(): string {
    return "I've analyzed the information you provided and can offer the following insights and recommendations. Based on the context, it appears that a structured approach would be beneficial, focusing on key areas of development while leveraging existing strengths. Consider implementing a phased plan that addresses immediate needs while building toward long-term goals. Regular assessment and feedback loops will be essential to measure progress effectively.";
  }
} 