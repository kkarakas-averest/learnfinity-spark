import { PersonalizationAgent } from './agents/roles/PersonalizationAgent';
import { ContentCreationAgent } from './agents/roles/ContentCreationAgent';
import { supabase } from './lib/supabase';
import type { EmployeeProfile } from './types/hr.types';

/**
 * Test function to verify if the PersonalizationAgent can pull employee data
 * and forward it to the ContentCreationAgent
 */
async function testPersonalizationToContentCreationFlow(employeeId: string): Promise<void> {
  console.log('Starting PersonalizationAgent → ContentCreationAgent test flow');
  console.log('----------------------------------------------------------');
  
  try {
    // 1. Initialize the agents
    console.log('Initializing agents...');
    const personalizationAgent = new PersonalizationAgent();
    const contentCreationAgent = new ContentCreationAgent();
    
    // 2. Pull employee data from Supabase
    console.log(`Fetching employee data for ID: ${employeeId}`);
    const { data: employeeData, error } = await supabase
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
    const employeeProfile: EmployeeProfile = {
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
    await contentCreationAgent.createInitialContent(enhancedProfile, learningPath);
    
    // 7. Test complete
    console.log('----------------------------------------------------------');
    console.log('Test completed successfully!');
    console.log('Personalization to Content Creation flow is working as expected.');
    
  } catch (error) {
    console.error('Test failed with error:');
    console.error(error);
    throw error;
  }
}

// Export the function for use in other modules
export { testPersonalizationToContentCreationFlow };

// If this script is run directly, execute the test with a default employee ID
if (require.main === module) {
  // Use a test employee ID - replace with an actual ID from your database
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