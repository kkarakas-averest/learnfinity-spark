import { z } from "zod";
import { CourseGenerationRequest, courseGenerationRequestSchema, GeneratedCourse } from "@/services/agent-service";

// Define the request and response types to avoid the next/server import
type NextRequest = Request;
type NextResponse = Response;

// Mock store for generated courses
const generatedCourses: Record<string, GeneratedCourse> = {};

// Create a helper function to create JSON responses
function createJsonResponse(data: any, options: { status?: number } = {}) {
  return new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json',
    },
    status: options.status || 200,
  });
}

/**
 * POST handler for generating a course using the agent system
 */
export async function POST(req: NextRequest) {
  try {
    // Parse the request body
    const body = await req.json();
    
    // Validate the request body against the schema
    const validationResult = courseGenerationRequestSchema.safeParse(body);
    
    if (!validationResult.success) {
      return createJsonResponse(
        { 
          error: "Invalid request parameters",
          details: validationResult.error.format() 
        },
        { status: 400 }
      );
    }
    
    const courseRequest = validationResult.data;
    
    // For now, we'll simulate the agent service call
    // In a real implementation, we would call the agent service
    const courseId = `course_${courseRequest.title.toLowerCase().replace(/\s+/g, '_')}_${Date.now().toString().slice(-6)}`;
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Generate a mock course response
    const course: GeneratedCourse = {
      id: courseId,
      title: courseRequest.title,
      description: courseRequest.description || `This course provides a comprehensive introduction to ${courseRequest.title}, covering fundamental concepts, techniques, and real-world applications.`,
      targetAudience: courseRequest.targetAudience,
      estimatedDuration: courseRequest.duration === 'short' ? '1-2 hours' : courseRequest.duration === 'medium' ? '4-5 hours' : '6+ hours',
      learningObjectives: courseRequest.learningObjectives.length > 0 
        ? courseRequest.learningObjectives
        : [
            `Understand the foundational concepts of ${courseRequest.title}`,
            "Learn about key techniques and methodologies",
            "Explore real-world applications and cases",
            "Gain practical experience through exercises and assignments"
          ],
      modules: Array.from({ length: courseRequest.moduleCount }, (_, i) => ({
        id: `module_${i + 1}`,
        title: i === 0 
          ? `Introduction to ${courseRequest.title}` 
          : i === courseRequest.moduleCount - 1 
            ? `Advanced Topics and Future Directions`
            : `Core Concepts - Part ${i + 1}`,
        description: `This module ${i === 0 ? 'introduces' : 'explores'} ${i === 0 ? 'the fundamental concepts' : 'key aspects'} of ${courseRequest.title}.`,
        topics: [
          `Topic ${i + 1}.1: ${i === 0 ? 'Basic Principles' : `Advanced Concept ${i}`}`,
          `Topic ${i + 1}.2: ${i === 0 ? 'Core Terminology' : `Key Techniques ${i}`}`,
          `Topic ${i + 1}.3: ${i === 0 ? 'Historical Context' : `Practical Applications ${i}`}`,
          `Topic ${i + 1}.4: ${i === 0 ? 'Modern Developments' : `Future Directions ${i}`}`,
        ],
        content: `# ${i === 0 ? 'Introduction to' : 'Core Concepts of'} ${courseRequest.title}

This section explores important concepts related to ${courseRequest.title}. Students will learn about the fundamental principles, practical applications, and latest developments in the field.

## Learning Objectives
- Understand ${i === 0 ? 'basic principles' : `advanced concept ${i}`} of ${courseRequest.title}
- Learn about ${i === 0 ? 'core terminology' : `key techniques ${i}`}
- Explore ${i === 0 ? 'historical context' : `practical applications ${i}`}
- Gain insights into ${i === 0 ? 'modern developments' : `future directions ${i}`}

## Content

${i === 0 ? `### Introduction
${courseRequest.title} is a field that has grown significantly in recent years. This module introduces students to the fundamental concepts that form the foundation of the subject.

### Historical Development
The field of ${courseRequest.title} has evolved through several key stages...` 
: `### Core Concepts
This module explores several essential concepts in ${courseRequest.title} including...

### Practical Applications
Students will learn how these concepts are applied in real-world situations...`}

## Summary
By the end of this module, students should have a solid understanding of ${i === 0 ? 'the foundational concepts' : `these advanced aspects`} of ${courseRequest.title} and be prepared to explore more complex topics in the following modules.`
      })),
      quizzes: courseRequest.includeQuizzes ? [
        {
          id: "quiz_1",
          title: `${courseRequest.title} Fundamentals`,
          questions: [
            {
              question: `What is the primary focus of ${courseRequest.title}?`,
              options: [
                "Understanding basic principles and applications",
                "Memorizing historical facts and dates",
                "Learning programming languages",
                "None of the above"
              ],
              correctAnswer: 0
            },
            {
              question: "Which of the following best describes the field's approach to problem-solving?",
              options: [
                "Using only traditional methods",
                "Applying systematic analysis and creative solutions",
                "Avoiding complex problems",
                "Relying solely on computer algorithms"
              ],
              correctAnswer: 1
            },
            {
              question: "How has the field evolved in recent years?",
              options: [
                "It has remained largely unchanged",
                "It has become less relevant",
                "It has integrated with other disciplines",
                "It has become more theoretical and less practical"
              ],
              correctAnswer: 2
            }
          ]
        }
      ] : [],
      assignments: courseRequest.includeAssignments ? [
        {
          id: "assignment_1",
          title: `${courseRequest.title} Practical Application`,
          description: `In this assignment, you will apply the concepts learned in the ${courseRequest.title} course to solve a real-world problem. You will analyze a case study, identify key issues, and propose solutions based on the principles covered in the course.`,
          tasks: [
            "Analyze the provided case study",
            "Identify the main challenges and opportunities",
            "Apply course concepts to develop potential solutions",
            "Create a comprehensive report with your findings and recommendations"
          ],
          submission: "Submit a report (2-3 pages) and prepare a 5-minute presentation summarizing your approach and conclusions."
        },
        {
          id: "assignment_2",
          title: `${courseRequest.title} Research Project`,
          description: `This project requires you to conduct original research on a topic related to ${courseRequest.title}. You will select a specific aspect of the field that interests you, research current trends and developments, and present your findings.`,
          tasks: [
            "Select a focused research topic",
            "Conduct a literature review",
            "Analyze current trends and future directions",
            "Prepare a comprehensive research paper"
          ],
          submission: "Submit a research paper (5-7 pages) with properly cited sources and a bibliography."
        }
      ] : [],
      resources: courseRequest.includeResources ? [
        {
          id: "resource_1",
          title: `${courseRequest.title}: A Comprehensive Guide`,
          type: "book",
          url: "#",
          description: "A comprehensive textbook covering all aspects of the subject with practical examples and case studies."
        },
        {
          id: "resource_2",
          title: "Video Lecture Series",
          type: "video",
          url: "#",
          description: "A collection of video lectures by industry experts explaining key concepts with demonstrations."
        },
        {
          id: "resource_3",
          title: "Interactive Learning Tools",
          type: "interactive",
          url: "#",
          description: "Online interactive tools and simulations to help practice and reinforce learning."
        },
        {
          id: "resource_4",
          title: "Industry Case Studies",
          type: "document",
          url: "#",
          description: "Real-world case studies showing how concepts are applied in industry settings."
        }
      ] : []
    };
    
    // Store the generated course in our mock store
    generatedCourses[courseId] = course;
    
    // Return the course
    return createJsonResponse(course);
    
  } catch (error) {
    console.error("Error generating course:", error);
    return createJsonResponse(
      { error: "Failed to generate course" },
      { status: 500 }
    );
  }
}

/**
 * GET handler to retrieve a specific course by ID
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('id');
    
    if (!courseId) {
      return createJsonResponse(
        { error: "Course ID is required" },
        { status: 400 }
      );
    }
    
    // Look up the course in our mock store
    const course = generatedCourses[courseId];
    
    if (!course) {
      return createJsonResponse(
        { error: "Course not found" },
        { status: 404 }
      );
    }
    
    // Return the course
    return createJsonResponse(course);
    
  } catch (error) {
    console.error("Error retrieving course:", error);
    return createJsonResponse(
      { error: "Failed to retrieve course" },
      { status: 500 }
    );
  }
} 