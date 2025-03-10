import { z } from 'zod';
import { GeneratedCourse } from '@/services/agent-service';
import { CourseService } from '@/services/course-service';
import { auth } from '@/lib/auth';

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
    // Get the user session
    const session = await auth();
    
    // Check if user is authenticated
    if (!session || !session.user || !session.user.id) {
      return createJsonResponse(
        { error: "Unauthorized - You must be logged in to save courses" },
        { status: 401 }
      );
    }
    
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
    
    // Save to database using our service
    try {
      const courseService = CourseService.getInstance();
      const courseId = await courseService.saveCourse(course, session.user.id);
      
      // Return success response with the new course ID
      return createJsonResponse({
        success: true,
        message: "Course saved successfully to database",
        courseId
      });
    } catch (dbError) {
      console.error("Database error:", dbError);
      return createJsonResponse(
        { error: "Failed to save course to database" },
        { status: 500 }
      );
    }
    
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
    // Get the user session
    const session = await auth();
    
    // Check if user is authenticated
    if (!session || !session.user || !session.user.id) {
      return createJsonResponse(
        { error: "Unauthorized - You must be logged in to view courses" },
        { status: 401 }
      );
    }
    
    // Get courses from database using our service
    try {
      const courseService = CourseService.getInstance();
      const result = await courseService.getCourses({
        userId: session.user.id
      });
      
      return createJsonResponse({
        courses: result.courses,
        count: result.total
      });
    } catch (dbError) {
      console.error("Database error:", dbError);
      return createJsonResponse(
        { error: "Failed to retrieve courses from database" },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error("Error retrieving courses:", error);
    return createJsonResponse(
      { error: "Failed to retrieve courses" },
      { status: 500 }
    );
  }
} 