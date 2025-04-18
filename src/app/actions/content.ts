'use server';

import { v4 as uuidv4 } from 'uuid';
import { AgentFactory } from '@/agents/AgentFactory';
import { 
  ContentGenerationRequest, 
  GeneratedContent
} from '@/agents/types';
import { ContentType, DifficultyLevel } from '@/types/ai-content.types';

// Extended request type to include additional properties
interface ExtendedContentGenerationRequest extends ContentGenerationRequest {
  includeExamples?: boolean;
  includeQuizQuestions?: boolean;
  tonePreference?: 'formal' | 'conversational' | 'technical';
  contentLength?: string;
  personalization?: {
    userName?: string;
    userRole?: string;
    userDepartment?: string;
    profileSummary?: string;
  };
}

// Extended content type to include additional properties
interface ExtendedGeneratedContent extends GeneratedContent {
  quiz?: {
    questions: Array<{
      id: string;
      question: string;
      type: string;
      options?: string[];
      correctAnswer: string | number;
      explanation?: string;
    }>;
  };
  summary?: string;
  suggestedNextSteps?: string[];
  relatedTopics?: string[];
  sections?: Array<{
    id: string;
    title: string;
    content: string;
    orderIndex: number;
  }>;
}

/**
 * Server action to generate educational content using the EducatorAgent
 */
export async function generateContent(
  request: ContentGenerationRequest
): Promise<{ 
  success: boolean; 
  content?: ExtendedGeneratedContent; 
  error?: string 
}> {
  try {
    console.log('[generateContent] Received content generation request:', {
      contentType: request.contentType,
      topic: request.topic,
      targetAudience: request.targetAudience,
      learningObjectives: request.learningObjectives?.length || 0
    });
    
    // Initialize the agent factory and get the educator agent
    const agentFactory = AgentFactory.getInstance();
    const educatorAgent = agentFactory.createAgent('educator') as any;
    
    if (!educatorAgent) {
      console.error('[generateContent] Failed to create educator agent');
      return {
        success: false,
        error: 'Failed to initialize content generation system'
      };
    }
    
    // Prepare the content generation request with additional properties
    const enhancedRequest: ExtendedContentGenerationRequest = {
      ...request,
      includeExamples: (request as any).includeExamples ?? true,
      includeQuizQuestions: (request as any).includeQuizQuestions ?? false,
      tonePreference: (request as any).tonePreference ?? 'conversational',
      personalization: {
        // Default personalization can be added here if needed
      }
    };
    
    // Generate content using the educator agent
    const generatedContent = await educatorAgent.generateContentForRequest(enhancedRequest);
    
    // Post-process the generated content
    const processedContent: ExtendedGeneratedContent = {
      id: generatedContent.id || uuidv4(),
      title: generatedContent.topic || request.topic,
      contentType: request.contentType,
      content: generatedContent.mainContent || '',
      summary: extractSummary(generatedContent.mainContent || ''),
      metadata: {
        generatedAt: new Date().toISOString(),
        targetSkillLevel: request.targetAudience?.skillLevel || 'intermediate' as DifficultyLevel,
        topics: [request.topic],
        keywords: request.keywords || []
      },
      sections: generatedContent.sections || [],
      suggestedNextSteps: generateSuggestedNextSteps(request.topic),
      relatedTopics: generateRelatedTopics(request.topic, request.keywords || [])
    };
    
    // If quiz questions were requested and generated, add them to the processed content
    if ((request as ExtendedContentGenerationRequest).includeQuizQuestions && generatedContent.quiz) {
      processedContent.quiz = generatedContent.quiz;
    }
    
    return {
      success: true,
      content: processedContent
    };
  } catch (error: any) {
    console.error('[generateContent] Error generating content:', error);
    return {
      success: false,
      error: error.message || 'Error generating content'
    };
  }
}

/**
 * Extract a summary from the generated content
 */
function extractSummary(content: string): string {
  // Simple approach: use the first paragraph as summary
  const paragraphs = content.split('\n\n');
  
  // Find the first paragraph that's not a heading and is substantial
  for (const paragraph of paragraphs) {
    // Skip headings (lines starting with #)
    if (paragraph.trim().startsWith('#')) continue;
    
    // Skip very short paragraphs
    if (paragraph.length < 50) continue;
    
    // Use this paragraph as summary
    return paragraph.substring(0, 200) + (paragraph.length > 200 ? '...' : '');
  }
  
  // Fallback if no suitable paragraph was found
  return 'Generated educational content based on the provided topic and learning objectives.';
}

/**
 * Estimate token count based on content length (rough approximation)
 */
function estimateTokenCount(content: string): number {
  // Rough approximation: 1 token ≈ 4 characters in English
  return Math.ceil(content.length / 4);
}

/**
 * Generate suggested next steps based on the topic
 */
function generateSuggestedNextSteps(topic: string): string[] {
  return [
    `Explore advanced concepts in ${topic}`,
    `Practice ${topic} with hands-on exercises`,
    `Apply ${topic} knowledge to real-world scenarios`
  ];
}

/**
 * Generate related topics based on the main topic and keywords
 */
function generateRelatedTopics(topic: string, keywords: string[]): string[] {
  const relatedTopics = [
    `Advanced ${topic}`,
    `Practical Applications of ${topic}`
  ];
  
  // Add keywords as related topics if they're different from the main topic
  for (const keyword of keywords) {
    if (keyword.toLowerCase() !== topic.toLowerCase() && 
        !relatedTopics.includes(keyword)) {
      relatedTopics.push(keyword);
    }
  }
  
  return relatedTopics.slice(0, 5); // Limit to 5 related topics
} 