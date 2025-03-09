/**
 * Course Service
 * 
 * Handles all course-related API communication.
 * In the mock version, it simulates API responses.
 */

import { RAGStatus } from '@/types/hr.types';

// Types
export interface Resource {
  id: string;
  title: string;
  type: 'pdf' | 'video' | 'link' | 'file';
  url: string;
}

export interface CourseModule {
  id: string;
  title: string;
  description: string;
  duration: string;
  contentType: 'text' | 'video' | 'quiz' | 'interactive';
  content: string;
  resources?: Resource[];
  completed: boolean;
}

export interface CourseData {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: string;
  progress: number;
  enrolledDate: string;
  lastAccessed?: string;
  ragStatus: RAGStatus;
  modules: CourseModule[];
}

/**
 * Course Service implementation
 */
class CourseService {
  /**
   * Fetch course by ID
   */
  async getCourseById(courseId: string): Promise<CourseData | null> {
    try {
      // In a real app, this would be an API call
      // For demo purposes, use mock data
      
      // Simulate network latency
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Return mock course data
      return {
        id: courseId || 'course-1',
        title: 'Introduction to Machine Learning',
        description: 'Learn the fundamentals of machine learning algorithms and their applications in real-world scenarios.',
        imageUrl: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=1600&h=900',
        level: 'Beginner',
        duration: '8 hours',
        progress: 35,
        enrolledDate: '2023-12-10',
        lastAccessed: '2023-12-15',
        ragStatus: 'green',
        modules: [
          {
            id: 'module-1',
            title: 'Introduction to ML Concepts',
            description: 'Understand the basic concepts and terminology of machine learning.',
            duration: '1 hour',
            contentType: 'text',
            content: `
              # Introduction to Machine Learning
              
              Machine learning is a subset of artificial intelligence that focuses on developing systems that can learn from and make decisions based on data.
              
              ## Key Concepts
              
              - **Supervised Learning**: The algorithm is trained on labeled data.
              - **Unsupervised Learning**: The algorithm finds patterns in unlabeled data.
              - **Reinforcement Learning**: The algorithm learns through trial and error.
              
              ## Applications
              
              Machine learning is used in various fields including:
              - Image and speech recognition
              - Natural language processing
              - Recommendation systems
              - Fraud detection
            `,
            resources: [
              { id: 'res-1', title: 'ML Glossary', type: 'pdf', url: '/resources/ml-glossary.pdf' },
              { id: 'res-2', title: 'Introduction Video', type: 'video', url: 'https://example.com/videos/intro-ml' }
            ],
            completed: true
          },
          {
            id: 'module-2',
            title: 'Supervised Learning',
            description: 'Learn about classification and regression techniques.',
            duration: '2 hours',
            contentType: 'video',
            content: 'https://example.com/videos/supervised-learning',
            resources: [
              { id: 'res-3', title: 'Classification Guide', type: 'pdf', url: '/resources/classification.pdf' },
              { id: 'res-4', title: 'Regression Examples', type: 'link', url: 'https://example.com/regression' }
            ],
            completed: true
          },
          {
            id: 'module-3',
            title: 'Unsupervised Learning',
            description: 'Explore clustering and dimensionality reduction.',
            duration: '2 hours',
            contentType: 'text',
            content: `
              # Unsupervised Learning
              
              Unsupervised learning involves training algorithms to find patterns in data without predefined labels.
              
              ## Clustering
              
              Clustering groups similar data points together. Common algorithms include:
              - K-means
              - Hierarchical clustering
              - DBSCAN
              
              ## Dimensionality Reduction
              
              These techniques reduce the number of variables in data while preserving important information:
              - Principal Component Analysis (PCA)
              - t-SNE
              - Autoencoders
            `,
            resources: [
              { id: 'res-5', title: 'Clustering Tutorial', type: 'pdf', url: '/resources/clustering.pdf' }
            ],
            completed: false
          },
          {
            id: 'module-4',
            title: 'Reinforcement Learning',
            description: 'Study how agents learn from their environment.',
            duration: '3 hours',
            contentType: 'interactive',
            content: 'https://example.com/interactive/reinforcement-learning',
            resources: [
              { id: 'res-6', title: 'RL Examples', type: 'pdf', url: '/resources/rl-examples.pdf' }
            ],
            completed: false
          }
        ]
      };
    } catch (error) {
      console.error('Error fetching course:', error);
      return null;
    }
  }

  /**
   * Update module completion status
   */
  async updateModuleCompletion(courseId: string, moduleId: string, completed: boolean): Promise<boolean> {
    try {
      // In a real app, this would be an API call
      // For demo purposes, just log and return success
      console.log(`Updating module ${moduleId} in course ${courseId} to ${completed ? 'completed' : 'incomplete'}`);
      
      // Simulate network latency
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return true;
    } catch (error) {
      console.error('Error updating module completion:', error);
      return false;
    }
  }

  /**
   * Update module bookmark (timestamp in seconds)
   */
  async updateBookmark(courseId: string, moduleId: string, timeInSeconds: number): Promise<boolean> {
    try {
      // In a real app, this would be an API call
      // For demo purposes, just log and return success
      console.log(`Setting bookmark for module ${moduleId} in course ${courseId} at ${timeInSeconds} seconds`);
      
      // Simulate network latency
      await new Promise(resolve => setTimeout(resolve, 300));
      
      return true;
    } catch (error) {
      console.error('Error updating bookmark:', error);
      return false;
    }
  }

  /**
   * Submit feedback for a course
   */
  async submitFeedback(courseId: string, feedback: { rating: number; comments: string }): Promise<boolean> {
    try {
      // In a real app, this would be an API call
      // For demo purposes, just log and return success
      console.log(`Submitting feedback for course ${courseId}:`, feedback);
      
      // Simulate network latency
      await new Promise(resolve => setTimeout(resolve, 700));
      
      return true;
    } catch (error) {
      console.error('Error submitting feedback:', error);
      return false;
    }
  }
}

// Create and export a singleton instance
export const courseService = new CourseService();
export default courseService; 