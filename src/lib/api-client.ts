/**
 * API client utilities for making requests to Vercel serverless functions
 */

/**
 * Enroll a user in a course
 * @param courseId - The ID of the course to enroll in
 * @param userId - The ID of the user to enroll
 * @returns Promise with the enrollment result
 */
export async function enrollInCourse(courseId: string, userId: string) {
  try {
    const response = await fetch(`/api/hr/courses/${courseId}/enrollment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      // If user is already enrolled, this isn't an error for our UI
      if (response.status === 409) {
        return {
          success: true,
          message: 'Already enrolled in this course',
          enrollment: errorData.enrollment,
        };
      }
      throw new Error(errorData.error || 'Failed to enroll in course');
    }

    const data = await response.json();
    return {
      success: true,
      message: 'Successfully enrolled in course',
      enrollment: data.enrollment,
    };
  } catch (error) {
    console.error('Error enrolling in course:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
} 