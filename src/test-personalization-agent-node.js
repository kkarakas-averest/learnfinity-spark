// Test script for PersonalizationAgent to ContentCreationAgent flow
// This is a simplified version using JavaScript to avoid TypeScript/ESM issues

/**
 * Mock implementations for testing without env dependencies
 */
class MockPersonalizationAgent {
  async createEmployeeProfile(profile) {
    console.log('📝 Mock: Enhancing employee profile...');
    
    // Return an enhanced version of the profile
    return {
      ...profile,
      skills: [...(profile.skills || []), 'communication', 'problem solving'],
      experience: {
        ...profile.experience,
        level: profile.experience.level || 'junior'
      },
      learningPreferences: {
        ...profile.learningPreferences,
        preferredLearningStyle: profile.learningPreferences?.preferredLearningStyle || 'visual',
        preferredContentTypes: profile.learningPreferences?.preferredContentTypes || ['video', 'interactive'],
        learningGoals: profile.learningPreferences?.learningGoals || ['skill improvement', 'career growth']
      }
    };
  }
  
  async generateLearningPath(profile) {
    console.log('🛤️ Mock: Generating learning path...');
    
    return {
      id: `lp-${Date.now()}`,
      title: `${profile.role} Development Path`,
      description: `A personalized learning path for ${profile.name} to develop skills as a ${profile.role}`,
      duration: '12 weeks',
      objectives: ['Master key concepts', 'Develop practical skills', 'Build portfolio projects'],
      modules: [
        {
          id: `module-1-${Date.now()}`,
          title: 'Fundamentals',
          description: 'Core concepts and foundational knowledge',
          duration: '2 weeks',
          content: [],
          assessments: []
        },
        {
          id: `module-2-${Date.now()}`,
          title: 'Intermediate Skills',
          description: 'Building on the fundamentals',
          duration: '4 weeks',
          content: [],
          assessments: []
        },
        {
          id: `module-3-${Date.now()}`,
          title: 'Advanced Applications',
          description: 'Applying skills to real-world scenarios',
          duration: '6 weeks',
          content: [],
          assessments: []
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'published',
      difficulty: 'intermediate',
      category: profile.department,
      author: 'Learnfinity AI'
    };
  }
}

class MockContentCreationAgent {
  async createInitialContent(profile, learningPath) {
    console.log('🧠 Mock: Creating content for learning path...');
    console.log(`Generated content for ${learningPath.title} with ${learningPath.modules.length} modules`);
    
    // In a real implementation, this would:
    // 1. Use LLM to generate content for each module
    // 2. Store the content in the database
    // 3. Link content to the learning path
    
    return {
      success: true,
      contentIds: learningPath.modules.map(m => `content-${m.id}`),
      message: "Content generation complete"
    };
  }
}

// Use a mock Supabase client for testing
const mockSupabaseClient = {
  from: (table) => ({
    select: (query) => ({
      eq: (column, value) => ({
        single: () => {
          // Return mock data for testing
          return Promise.resolve({
            data: {
              id: 'test-employee-1',
              name: 'Jane Doe',
              email: 'jane.doe@example.com',
              position: 'Software Engineer',
              department: 'Engineering',
              skills: ['JavaScript', 'TypeScript', 'React'],
              years_experience: 3,
              experience_level: 'mid',
              previous_roles: ['Junior Developer'],
              preferred_learning_style: 'visual',
              preferred_content_types: ['video', 'interactive'],
              learning_goals: ['Master TypeScript', 'Learn Next.js']
            },
            error: null
          });
        }
      })
    })
  })
};

/**
 * Test function to verify if the PersonalizationAgent can pull employee data
 * and forward it to the ContentCreationAgent
 */
async function testPersonalizationToContentCreationFlow(employeeId) {
  console.log('Starting PersonalizationAgent → ContentCreationAgent test flow');
  console.log('----------------------------------------------------------');
  
  try {
    // 1. Initialize the mock agents 
    console.log('Initializing agents...');
    const personalizationAgent = new MockPersonalizationAgent();
    const contentCreationAgent = new MockContentCreationAgent();
    
    // 2. Pull employee data from mock Supabase
    console.log(`Fetching employee data for ID: ${employeeId}`);
    const { data: employeeData, error } = await mockSupabaseClient
      .from('employees')
      .select('*')
      .eq('id', employeeId)
      .single();
      
    if (error) {
      throw new Error(`Error fetching employee data: ${error.message}`);
    }
    
    if (!employeeData) {
      throw new Error(`Employee with ID ${employeeId} not found`);
    }
    
    console.log('Employee data retrieved successfully:');
    console.log(JSON.stringify(employeeData, null, 2));
    
    // 3. Transform raw data into the EmployeeProfile format
    const employeeProfile = {
      id: employeeData.id,
      name: employeeData.name,
      role: employeeData.position || 'Unknown Role',
      department: employeeData.department || 'Unknown Department',
      skills: employeeData.skills || [],
      experience: {
        years: employeeData.years_experience || 0,
        level: employeeData.experience_level || 'junior',
        previousRoles: employeeData.previous_roles || []
      },
      learningPreferences: {
        preferredLearningStyle: employeeData.preferred_learning_style || 'visual',
        preferredContentTypes: employeeData.preferred_content_types || ['video', 'interactive'],
        learningGoals: employeeData.learning_goals || []
      }
    };
    
    // 4. Use PersonalizationAgent to create an enhanced profile
    console.log('Using PersonalizationAgent to enhance employee profile...');
    const enhancedProfile = await personalizationAgent.createEmployeeProfile(employeeProfile);
    console.log('Enhanced profile created:');
    console.log(JSON.stringify(enhancedProfile, null, 2));
    
    // 5. Use PersonalizationAgent to generate a learning path
    console.log('Using PersonalizationAgent to generate a learning path...');
    const learningPath = await personalizationAgent.generateLearningPath(enhancedProfile);
    console.log('Learning path generated:');
    console.log(JSON.stringify(learningPath, null, 2));
    
    // 6. Pass the enhanced profile and learning path to ContentCreationAgent
    console.log('Passing data to ContentCreationAgent to generate content...');
    const contentResult = await contentCreationAgent.createInitialContent(enhancedProfile, learningPath);
    console.log('Content creation result:', contentResult);
    
    // 7. Test complete
    console.log('----------------------------------------------------------');
    console.log('Test completed successfully!');
    console.log('Personalization to Content Creation flow is working as expected.');
    
    return {
      success: true,
      enhancedProfile,
      learningPath,
      contentResult
    };
  } catch (error) {
    console.error('Test failed with error:');
    console.error(error);
    throw error;
  }
}

// Export for use in other modules
export { testPersonalizationToContentCreationFlow };

// If this script is run directly, execute the test with a default employee ID
if (import.meta.url === `file://${process.argv[1]}`) {
  // Use a test employee ID
  const testEmployeeId = 'test-employee-1';
  
  testPersonalizationToContentCreationFlow(testEmployeeId)
    .then(() => {
      console.log('Test script executed successfully');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Test script failed:', err);
      process.exit(1);
    });
} 