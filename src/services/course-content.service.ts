/**
 * Course Content Service
 * Service for managing course content, modules, sections, and related operations
 */

import { 
  Course, 
  Module, 
  Section, 
  ContentType, 
  DifficultyLevel,
  ContentMetadata,
  CourseMetrics,
  CourseTemplate,
  PrerequisiteRelationship,
  ContentVariant
} from '../types/course.types';

// Mock data for demonstration purposes
const mockCourses: Course[] = [
  {
    id: 'course-001',
    title: 'Introduction to JavaScript',
    description: 'Learn the fundamentals of JavaScript programming, from basic syntax to advanced concepts like closures and promises.',
    shortDescription: 'Master JavaScript basics and advanced concepts',
    thumbnail: '/course-images/js-intro.jpg',
    bannerImage: '/course-banners/js-banner.jpg',
    modules: [],  // Will be populated from mockModules
    skillsGained: ['JavaScript', 'Web Development', 'Programming Fundamentals'],
    level: DifficultyLevel.BEGINNER,
    category: 'Web Development',
    tags: ['JavaScript', 'Frontend', 'Programming'],
    estimatedDuration: 480, // 8 hours
    isPublished: true,
    authorId: 'author-001',
    reviewedBy: 'reviewer-001',
    approvedBy: 'approver-001',
    publishedAt: new Date('2024-01-15'),
    createdAt: new Date('2023-11-10'),
    updatedAt: new Date('2024-01-15')
  },
  {
    id: 'course-002',
    title: 'React for Beginners',
    description: 'Start your journey with React, the popular JavaScript library for building user interfaces. Learn components, props, state, and more.',
    shortDescription: 'Learn to build modern UIs with React',
    thumbnail: '/course-images/react-intro.jpg',
    bannerImage: '/course-banners/react-banner.jpg',
    modules: [], // Will be populated from mockModules
    skillsGained: ['React', 'JavaScript', 'UI Development'],
    level: DifficultyLevel.BEGINNER,
    category: 'Web Development',
    tags: ['React', 'JavaScript', 'Frontend'],
    estimatedDuration: 600, // 10 hours
    isPublished: true,
    authorId: 'author-002',
    reviewedBy: 'reviewer-001',
    approvedBy: 'approver-001',
    publishedAt: new Date('2024-02-20'),
    createdAt: new Date('2023-12-05'),
    updatedAt: new Date('2024-02-20')
  }
];

const mockModules: Record<string, Module[]> = {
  'course-001': [
    {
      id: 'module-001',
      courseId: 'course-001',
      title: 'JavaScript Basics',
      description: 'Learn the core syntax and basic concepts of JavaScript',
      order: 1,
      sections: [], // Will be populated from mockSections
      isLocked: false,
      createdAt: new Date('2023-11-10'),
      updatedAt: new Date('2023-12-01')
    },
    {
      id: 'module-002',
      courseId: 'course-001',
      title: 'Functions and Scope',
      description: 'Understand JavaScript functions, scope, and closures',
      order: 2,
      sections: [], // Will be populated from mockSections
      isLocked: true,
      prerequisiteModuleIds: ['module-001'],
      unlockCriteria: {
        previousModuleCompletion: true
      },
      createdAt: new Date('2023-11-15'),
      updatedAt: new Date('2023-12-01')
    }
  ],
  'course-002': [
    {
      id: 'module-003',
      courseId: 'course-002',
      title: 'React Fundamentals',
      description: 'Learn the basics of React, components, and JSX',
      order: 1,
      sections: [], // Will be populated from mockSections
      isLocked: false,
      createdAt: new Date('2023-12-05'),
      updatedAt: new Date('2024-01-10')
    }
  ]
};

const mockSections: Record<string, Section[]> = {
  'module-001': [
    {
      id: 'section-001',
      moduleId: 'module-001',
      title: 'Introduction to JavaScript',
      description: 'Overview of JavaScript and its role in web development',
      contentType: ContentType.VIDEO,
      content: 'https://example.com/videos/js-intro.mp4',
      order: 1,
      isOptional: false,
      estimatedDuration: 15,
      createdAt: new Date('2023-11-10'),
      updatedAt: new Date('2023-11-10')
    },
    {
      id: 'section-002',
      moduleId: 'module-001',
      title: 'Variables and Data Types',
      description: 'Learn about variables, constants, and data types in JavaScript',
      contentType: ContentType.TEXT,
      content: '# Variables and Data Types\n\nIn JavaScript, you can declare variables using `var`, `let`, or `const`...',
      order: 2,
      isOptional: false,
      estimatedDuration: 20,
      createdAt: new Date('2023-11-10'),
      updatedAt: new Date('2023-11-15')
    },
    {
      id: 'section-003',
      moduleId: 'module-001',
      title: 'JavaScript Basics Quiz',
      description: 'Test your knowledge of JavaScript basics',
      contentType: ContentType.QUIZ,
      content: JSON.stringify({
        questions: [
          {
            question: 'Which keyword is used to declare a variable that cannot be reassigned?',
            options: ['var', 'let', 'const', 'def'],
            correctAnswer: 2
          },
          // More questions would go here
        ]
      }),
      order: 3,
      isOptional: false,
      estimatedDuration: 10,
      createdAt: new Date('2023-11-12'),
      updatedAt: new Date('2023-11-12')
    }
  ],
  'module-002': [
    {
      id: 'section-004',
      moduleId: 'module-002',
      title: 'Function Declarations',
      description: 'Learn how to declare and use functions in JavaScript',
      contentType: ContentType.TEXT,
      content: '# Function Declarations\n\nIn JavaScript, you can define functions using function declarations, function expressions, or arrow functions...',
      order: 1,
      isOptional: false,
      estimatedDuration: 25,
      createdAt: new Date('2023-11-15'),
      updatedAt: new Date('2023-11-20')
    }
  ],
  'module-003': [
    {
      id: 'section-005',
      moduleId: 'module-003',
      title: 'What is React?',
      description: 'Introduction to React and its core concepts',
      contentType: ContentType.VIDEO,
      content: 'https://example.com/videos/react-intro.mp4',
      order: 1,
      isOptional: false,
      estimatedDuration: 20,
      createdAt: new Date('2023-12-05'),
      updatedAt: new Date('2023-12-05')
    }
  ]
};

const mockCourseMetrics: Record<string, CourseMetrics> = {
  'course-001': {
    courseId: 'course-001',
    enrolledCount: 1250,
    completionRate: 0.68,
    averageRating: 4.2,
    reviewCount: 345,
    averageTimeToComplete: 12, // days
    topFeedbackKeywords: ['helpful', 'clear', 'beginner-friendly'],
    completionsByDepartment: {
      'Engineering': 450,
      'Product': 280,
      'Marketing': 120
    },
    averageQuizScores: {
      'module-001': 85,
      'module-002': 78
    },
    mostChallenging: {
      moduleId: 'module-002',
      moduleName: 'Functions and Scope',
      failRate: 0.25
    },
    droppedOffAt: {
      'module-001': 210,
      'module-002': 390
    }
  }
};

// Connect modules to their respective courses
for (const courseId in mockModules) {
  const courseIndex = mockCourses.findIndex(course => course.id === courseId);
  if (courseIndex >= 0) {
    mockCourses[courseIndex].modules = mockModules[courseId];
  }
}

// Connect sections to their respective modules
for (const courseId in mockModules) {
  mockModules[courseId].forEach(module => {
    if (mockSections[module.id]) {
      module.sections = mockSections[module.id];
    }
  });
}

/**
 * Service for managing course content
 */
export class CourseContentService {
  /**
   * Get all available courses
   */
  async getAllCourses(): Promise<Course[]> {
    // In a real implementation, this would query the database
    return [...mockCourses];
  }

  /**
   * Get a course by ID with full module and section data
   */
  async getCourseById(courseId: string): Promise<Course | null> {
    // In a real implementation, this would query the database with joins
    const course = mockCourses.find(c => c.id === courseId);
    return course ? { ...course } : null;
  }

  /**
   * Get courses by category
   */
  async getCoursesByCategory(category: string): Promise<Course[]> {
    // In a real implementation, this would query the database with filtering
    return mockCourses.filter(course => course.category === category);
  }

  /**
   * Get courses by skill
   */
  async getCoursesBySkill(skill: string): Promise<Course[]> {
    // In a real implementation, this would query the database with filtering
    return mockCourses.filter(course => course.skillsGained.includes(skill));
  }

  /**
   * Create a new course
   */
  async createCourse(courseData: Partial<Course>): Promise<Course> {
    // In a real implementation, this would insert into the database
    const newCourse: Course = {
      id: `course-${Date.now()}`,
      title: courseData.title || 'Untitled Course',
      description: courseData.description || '',
      shortDescription: courseData.shortDescription || '',
      thumbnail: courseData.thumbnail,
      bannerImage: courseData.bannerImage,
      modules: [],
      skillsGained: courseData.skillsGained || [],
      level: courseData.level || DifficultyLevel.BEGINNER,
      category: courseData.category || 'Uncategorized',
      tags: courseData.tags || [],
      estimatedDuration: courseData.estimatedDuration || 0,
      isPublished: false,
      authorId: courseData.authorId || 'unknown',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    mockCourses.push(newCourse);
    return newCourse;
  }

  /**
   * Update an existing course
   */
  async updateCourse(courseId: string, courseData: Partial<Course>): Promise<Course | null> {
    // In a real implementation, this would update the database
    const courseIndex = mockCourses.findIndex(c => c.id === courseId);
    
    if (courseIndex >= 0) {
      mockCourses[courseIndex] = {
        ...mockCourses[courseIndex],
        ...courseData,
        updatedAt: new Date()
      };
      return mockCourses[courseIndex];
    }
    
    return null;
  }

  /**
   * Delete a course and all its modules and sections
   */
  async deleteCourse(courseId: string): Promise<boolean> {
    // In a real implementation, this would delete from the database with cascading
    const courseIndex = mockCourses.findIndex(c => c.id === courseId);
    
    if (courseIndex >= 0) {
      mockCourses.splice(courseIndex, 1);
      delete mockModules[courseId];
      return true;
    }
    
    return false;
  }

  /**
   * Get all modules for a course
   */
  async getModulesByCourse(courseId: string): Promise<Module[]> {
    // In a real implementation, this would query the database with filtering
    return mockModules[courseId] || [];
  }

  /**
   * Get a module by ID
   */
  async getModuleById(moduleId: string): Promise<Module | null> {
    // In a real implementation, this would query the database
    for (const courseId in mockModules) {
      const module = mockModules[courseId].find(m => m.id === moduleId);
      if (module) return { ...module };
    }
    
    return null;
  }

  /**
   * Create a new module in a course
   */
  async createModule(courseId: string, moduleData: Partial<Module>): Promise<Module | null> {
    // In a real implementation, this would insert into the database
    const course = mockCourses.find(c => c.id === courseId);
    
    if (!course) return null;
    
    if (!mockModules[courseId]) {
      mockModules[courseId] = [];
    }
    
    const order = mockModules[courseId].length + 1;
    
    const newModule: Module = {
      id: `module-${Date.now()}`,
      courseId,
      title: moduleData.title || `Module ${order}`,
      description: moduleData.description || '',
      order,
      sections: [],
      isLocked: moduleData.isLocked ?? (order > 1),
      prerequisiteModuleIds: moduleData.prerequisiteModuleIds,
      unlockCriteria: moduleData.unlockCriteria,
      metadata: moduleData.metadata,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    mockModules[courseId].push(newModule);
    course.modules.push(newModule);
    
    return newModule;
  }

  /**
   * Update an existing module
   */
  async updateModule(moduleId: string, moduleData: Partial<Module>): Promise<Module | null> {
    // In a real implementation, this would update the database
    for (const courseId in mockModules) {
      const moduleIndex = mockModules[courseId].findIndex(m => m.id === moduleId);
      
      if (moduleIndex >= 0) {
        mockModules[courseId][moduleIndex] = {
          ...mockModules[courseId][moduleIndex],
          ...moduleData,
          updatedAt: new Date()
        };
        
        // Update the module in the course as well
        const courseIndex = mockCourses.findIndex(c => c.id === courseId);
        if (courseIndex >= 0) {
          const courseModuleIndex = mockCourses[courseIndex].modules.findIndex(m => m.id === moduleId);
          if (courseModuleIndex >= 0) {
            mockCourses[courseIndex].modules[courseModuleIndex] = mockModules[courseId][moduleIndex];
          }
        }
        
        return mockModules[courseId][moduleIndex];
      }
    }
    
    return null;
  }

  /**
   * Get all sections for a module
   */
  async getSectionsByModule(moduleId: string): Promise<Section[]> {
    // In a real implementation, this would query the database with filtering
    return mockSections[moduleId] || [];
  }

  /**
   * Get a section by ID
   */
  async getSectionById(sectionId: string): Promise<Section | null> {
    // In a real implementation, this would query the database
    for (const moduleId in mockSections) {
      const section = mockSections[moduleId].find(s => s.id === sectionId);
      if (section) return { ...section };
    }
    
    return null;
  }

  /**
   * Create a new section in a module
   */
  async createSection(moduleId: string, sectionData: Partial<Section>): Promise<Section | null> {
    // In a real implementation, this would insert into the database
    let module: Module | null = null;
    
    // Find the module
    for (const courseId in mockModules) {
      const foundModule = mockModules[courseId].find(m => m.id === moduleId);
      if (foundModule) {
        module = foundModule;
        break;
      }
    }
    
    if (!module) return null;
    
    if (!mockSections[moduleId]) {
      mockSections[moduleId] = [];
    }
    
    const order = mockSections[moduleId].length + 1;
    
    const newSection: Section = {
      id: `section-${Date.now()}`,
      moduleId,
      title: sectionData.title || `Section ${order}`,
      description: sectionData.description,
      contentType: sectionData.contentType || ContentType.TEXT,
      content: sectionData.content || '',
      order,
      isOptional: sectionData.isOptional || false,
      estimatedDuration: sectionData.estimatedDuration || 0,
      metadata: sectionData.metadata,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    mockSections[moduleId].push(newSection);
    module.sections.push(newSection);
    
    return newSection;
  }

  /**
   * Get course metrics
   */
  async getCourseMetrics(courseId: string): Promise<CourseMetrics | null> {
    // In a real implementation, this would aggregate data from different tables
    return mockCourseMetrics[courseId] || null;
  }

  /**
   * Search courses by query
   */
  async searchCourses(query: string): Promise<Course[]> {
    // In a real implementation, this would use full-text search in the database
    query = query.toLowerCase();
    return mockCourses.filter(course => 
      course.title.toLowerCase().includes(query) ||
      course.description.toLowerCase().includes(query) ||
      course.tags.some(tag => tag.toLowerCase().includes(query))
    );
  }
}

// Export singleton instance
export const courseContentService = new CourseContentService(); 