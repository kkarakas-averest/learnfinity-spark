
// Browser-compatible implementation of the course display service

const courseDisplayService = {
  /**
   * Get course details
   * @param {string} courseId
   * @returns {Promise<Object>}
   */
  async getCourseDetails(courseId) {
    try {
      console.log('Fetching course details for ID:', courseId);
      // Simulate fetching course data
      // In a real app, this would call an API or Supabase
      return {
        id: courseId,
        title: "Sample Course",
        description: "This is a sample course description",
        modules: []
      };
    } catch (error) {
      console.error("Error fetching course details:", error);
      return null;
    }
  },

  /**
   * Get course content
   * @param {string} courseId
   * @returns {Promise<Object>}
   */
  async getCourseContent(courseId) {
    try {
      console.log('Fetching course content for ID:', courseId);
      // Use a simple fetch instead of requiring node modules
      const response = await fetch(`/data/course_content_${courseId}.json`);
      if (!response.ok) {
        throw new Error(`Failed to fetch course content: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching course content:", error);
      return {
        modules: [],
        resources: []
      };
    }
  }
};

export default courseDisplayService;
