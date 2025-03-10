import { GeneratedCourse } from '@/services/agent-service';
import { CourseService } from '@/services/course-service';
import { getCurrentSession } from '@/lib/auth';

// Define the request and response types for simpler implementation
type NextRequest = Request;

/**
 * Helper function to create standardized JSON responses
 */
function createJsonResponse(data: any, options: { status?: number } = {}) {
  return new Response(JSON.stringify(data), {
    status: options.status || 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

/**
 * POST endpoint to save a generated course to the database
 * 
 * This API receives a course generated by an agent, validates the user's session,
 * and saves the course to the database using CourseService.
 * 
 * Request body schema:
 * {
 *   course: GeneratedCourse // The course data generated by the agent
 * }
 * 
 * Response schema:
 * {
 *   success: boolean, // Whether the operation was successful
 *   courseId?: string, // The ID of the newly created course if successful
 *   message?: string, // Error message if unsuccessful
 *   redirectUrl?: string // URL to view the course if successful
 * }
 */
export async function POST(req: NextRequest) {
  try {
    // Get the user session
    const sessionResult = await getCurrentSession();
    
    // Check if user is authenticated
    if (!sessionResult.success || !sessionResult.user) {
      return createJsonResponse(
        { success: false, message: "Unauthorized. You must be logged in to save a course." },
        { status: 401 }
      );
    }
    
    // Parse the request body
    const body = await req.json();
    
    // Validate the request body
    if (!body.course) {
      return createJsonResponse(
        { success: false, message: "No course data provided" },
        { status: 400 }
      );
    }
    
    const course: GeneratedCourse = body.course;
    
    // Get user ID from session
    const userId = sessionResult.user.id;
    
    // Save the course to the database
    const courseService = CourseService.getInstance();
    const courseId = await courseService.saveCourse(course, userId);
    
    // Return success response with course ID and redirect URL
    return createJsonResponse({
      success: true,
      courseId,
      message: "Course saved successfully",
      redirectUrl: `/courses/${courseId}`
    });
    
  } catch (error) {
    console.error("Error saving course:", error);
    
    // Return error response
    return createJsonResponse(
      { 
        success: false, 
        message: error instanceof Error ? error.message : "An unknown error occurred" 
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to retrieve all courses
 * 
 * This API retrieves a list of courses with pagination options.
 * 
 * Query parameters:
 * - page: Page number (default: 1)
 * - limit: Number of items per page (default: 10)
 * - published: Filter by published status (true/false)
 * - userId: Filter by creator user ID
 * 
 * Response schema:
 * {
 *   courses: Course[], // Array of course objects
 *   total: number,    // Total number of courses matching the filters
 *   page: number,     // Current page number
 *   limit: number,    // Current limit per page
 *   totalPages: number // Total number of pages
 * }
 */
export async function GET() {
  try {
    // Get the user session
    const sessionResult = await getCurrentSession();
    
    // For now, we'll return a simple response
    // This will be expanded to retrieve actual courses
    const courseService = CourseService.getInstance();
    const result = await courseService.getCourses({
      page: 1,
      limit: 10,
      published: true,
      userId: sessionResult.user?.id
    });
    
    return createJsonResponse({
      ...result,
      page: 1,
      limit: 10,
      totalPages: Math.ceil(result.total / 10)
    });
    
  } catch (error) {
    console.error("Error retrieving courses:", error);
    
    return createJsonResponse(
      { 
        success: false, 
        message: error instanceof Error ? error.message : "An unknown error occurred" 
      },
      { status: 500 }
    );
  }
} 