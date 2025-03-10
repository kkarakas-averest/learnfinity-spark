import { z } from 'zod';
import { GeneratedCourse } from '@/services/agent-service';

// Define the request and response types for simpler implementation
type NextRequest = Request;

// Create a helper function to create JSON responses
function createJsonResponse(data: any, options: { status?: number } = {}) {
  return new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json',
    },
    status: options.status || 200,
  });
}

// In-memory storage for saved courses (simulating database)
const savedCourses: Record<string, GeneratedCourse> = {};

// Course save request schema
const courseSaveSchema = z.object({
  course: z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    targetAudience: z.string(),
    estimatedDuration: z.string(),
    learningObjectives: z.array(z.string()),
    modules: z.array(
      z.object({
        id: z.string(),
        title: z.string(),
        description: z.string(),
        topics: z.array(z.string()),
        content: z.string()
      })
    ),
    quizzes: z.array(
      z.object({
        id: z.string(),
        title: z.string(),
        questions: z.array(
          z.object({
            question: z.string(),
            options: z.array(z.string()),
            correctAnswer: z.number()
          })
        )
      })
    ).optional(),
    assignments: z.array(
      z.object({
        id: z.string(),
        title: z.string(),
        description: z.string(),
        tasks: z.array(z.string()),
        submission: z.string()
      })
    ).optional(),
    resources: z.array(
      z.object({
        id: z.string(),
        title: z.string(),
        type: z.string(),
        url: z.string(),
        description: z.string()
      })
    ).optional()
  })
});

/**
 * POST handler for saving a generated course
 */
export async function POST(req: NextRequest) {
  try {
    // Parse the request body
    const body = await req.json();
    
    // Validate the request body
    const validationResult = courseSaveSchema.safeParse(body);
    
    if (!validationResult.success) {
      return createJsonResponse(
        { 
          error: "Invalid course data",
          details: validationResult.error.format() 
        },
        { status: 400 }
      );
    }
    
    const { course } = validationResult.data;
    
    // In a real app, this would save to a database
    savedCourses[course.id] = course;
    
    // Add metadata about when the course was saved
    const savedCourse = {
      ...course,
      metadata: {
        savedAt: new Date(),
        status: "published",
        version: 1
      }
    };
    
    // Return success response
    return createJsonResponse({
      success: true,
      message: "Course saved successfully",
      course: savedCourse
    });
    
  } catch (error) {
    console.error("Error saving course:", error);
    return createJsonResponse(
      { error: "Failed to save course" },
      { status: 500 }
    );
  }
}

/**
 * GET handler to retrieve all saved courses
 */
export async function GET() {
  try {
    // In a real app, this would query a database
    const courses = Object.values(savedCourses);
    
    return createJsonResponse({
      courses,
      count: courses.length
    });
    
  } catch (error) {
    console.error("Error retrieving courses:", error);
    return createJsonResponse(
      { error: "Failed to retrieve courses" },
      { status: 500 }
    );
  }
} 