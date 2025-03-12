/**
 * Employee/Learner Data Seeding Utility
 * 
 * This script populates the database with sample employee data for development and testing.
 */

import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/lib/supabase-client';

/**
 * Seeds the employees table with sample data
 */
export const seedEmployees = async () => {
  console.log('Seeding employees table...');
  
  // Sample employee data
  const employees = [
    {
      id: uuidv4(),
      user_id: null, // Would be linked to auth user in real implementation
      first_name: 'John',
      last_name: 'Smith',
      email: 'john.smith@example.com',
      title: 'Senior Developer',
      department: 'Engineering',
      profile_image_url: 'https://example.com/profiles/john-smith.jpg',
      rag_status: 'green',
      rag_status_last_updated: new Date(),
      hire_date: new Date('2022-03-15'),
      employee_number: 'EMP001',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: uuidv4(),
      user_id: null,
      first_name: 'Sarah',
      last_name: 'Johnson',
      email: 'sarah.johnson@example.com',
      title: 'Product Manager',
      department: 'Product',
      profile_image_url: 'https://example.com/profiles/sarah-johnson.jpg',
      rag_status: 'green',
      rag_status_last_updated: new Date(),
      hire_date: new Date('2021-09-22'),
      employee_number: 'EMP002',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: uuidv4(),
      user_id: null,
      first_name: 'Michael',
      last_name: 'Chen',
      email: 'michael.chen@example.com',
      title: 'UX Designer',
      department: 'Design',
      profile_image_url: 'https://example.com/profiles/michael-chen.jpg',
      rag_status: 'amber',
      rag_status_last_updated: new Date(),
      hire_date: new Date('2023-01-10'),
      employee_number: 'EMP003',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: uuidv4(),
      user_id: null,
      first_name: 'Emily',
      last_name: 'Garcia',
      email: 'emily.garcia@example.com',
      title: 'Marketing Specialist',
      department: 'Marketing',
      profile_image_url: 'https://example.com/profiles/emily-garcia.jpg',
      rag_status: 'red',
      rag_status_last_updated: new Date(),
      hire_date: new Date('2022-07-05'),
      employee_number: 'EMP004',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: uuidv4(),
      user_id: null,
      first_name: 'David',
      last_name: 'Williams',
      email: 'david.williams@example.com',
      title: 'Sales Director',
      department: 'Sales',
      profile_image_url: 'https://example.com/profiles/david-williams.jpg',
      rag_status: 'green',
      rag_status_last_updated: new Date(),
      hire_date: new Date('2021-04-18'),
      employee_number: 'EMP005',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    }
  ];
  
  try {
    // Insert employees
    const { data, error } = await supabase
      .from('employees')
      .insert(employees)
      .select('id');
      
    if (error) throw error;
    
    console.log(`Successfully seeded ${data.length} employees`);
    return data.map(employee => employee.id);
  } catch (error) {
    console.error('Error seeding employees:', error);
    return [];
  }
};

/**
 * Seeds the learning_preferences table with sample data
 */
export const seedLearningPreferences = async (employeeIds: string[]) => {
  console.log('Seeding learning preferences...');
  
  if (!employeeIds || employeeIds.length === 0) {
    console.warn('No employee IDs provided for learning preferences seeding');
    return [];
  }
  
  const learningStyles = ['visual', 'auditory', 'reading', 'kinesthetic'];
  const contentFormats = ['video', 'text', 'audio', 'interactive'];
  const devices = ['desktop', 'laptop', 'tablet', 'mobile'];
  const learningTimes = ['morning', 'afternoon', 'evening'];
  
  // Create learning preferences for each employee
  const preferences = employeeIds.map(employeeId => {
    // Randomly select primary and secondary styles
    const primaryStyle = learningStyles[Math.floor(Math.random() * learningStyles.length)];
    const secondaryStyles = learningStyles
      .filter(style => style !== primaryStyle)
      .sort(() => 0.5 - Math.random())
      .slice(0, 2); // Select 1-2 secondary styles
    
    // Randomly select preferred content formats
    const preferredFormats = contentFormats
      .sort(() => 0.5 - Math.random())
      .slice(0, Math.floor(Math.random() * 3) + 2); // Select 2-4 formats
    
    // Randomly select preferred times
    const preferredTimes = learningTimes
      .sort(() => 0.5 - Math.random())
      .slice(0, Math.floor(Math.random() * 2) + 1); // Select 1-2 times
    
    return {
      id: uuidv4(),
      employee_id: employeeId,
      primary_style: primaryStyle,
      secondary_styles: secondaryStyles,
      preferred_content_formats: preferredFormats,
      preferred_session_duration: (Math.floor(Math.random() * 4) + 1) * 15, // 15, 30, 45, or 60 minutes
      preferred_learning_times: preferredTimes,
      preferred_device: devices[Math.floor(Math.random() * devices.length)],
      self_reported: true,
      created_at: new Date(),
      updated_at: new Date()
    };
  });
  
  try {
    // Insert learning preferences
    const { data, error } = await supabase
      .from('learning_preferences')
      .insert(preferences)
      .select('id');
      
    if (error) throw error;
    
    console.log(`Successfully seeded ${data.length} learning preferences`);
    return data.map(pref => pref.id);
  } catch (error) {
    console.error('Error seeding learning preferences:', error);
    return [];
  }
};

/**
 * Seeds the skill_records table with sample data
 */
export const seedSkillRecords = async (employeeIds: string[]) => {
  console.log('Seeding skill records...');
  
  if (!employeeIds || employeeIds.length === 0) {
    console.warn('No employee IDs provided for skill records seeding');
    return [];
  }
  
  // Define skills by category
  const skillsByCategory = {
    'Technical': [
      'JavaScript', 'React', 'TypeScript', 'Node.js', 'Python', 'SQL', 'AWS', 'Docker',
      'Git', 'CI/CD', 'GraphQL', 'REST API Design', 'Database Design'
    ],
    'Design': [
      'UI Design', 'UX Design', 'Figma', 'Adobe XD', 'Responsive Design',
      'Prototyping', 'User Research', 'Accessibility'
    ],
    'Management': [
      'Project Management', 'Agile', 'Scrum', 'Team Leadership', 'Strategic Planning',
      'Resource Allocation', 'Budgeting', 'Performance Reviews'
    ],
    'Soft Skills': [
      'Communication', 'Presentation', 'Negotiation', 'Problem Solving',
      'Critical Thinking', 'Time Management', 'Conflict Resolution'
    ]
  };
  
  const proficiencyLevels = ['beginner', 'intermediate', 'advanced', 'expert'];
  
  // Generate skill records for each employee
  const skillRecords = [];
  
  for (const employeeId of employeeIds) {
    // Select 1-2 main skill categories for this employee
    const categories = Object.keys(skillsByCategory)
      .sort(() => 0.5 - Math.random())
      .slice(0, Math.floor(Math.random() * 2) + 1);
    
    for (const category of categories) {
      // Select 3-6 skills from each category
      const skills = skillsByCategory[category]
        .sort(() => 0.5 - Math.random())
        .slice(0, Math.floor(Math.random() * 4) + 3);
      
      for (const skill of skills) {
        // Assign a proficiency level to each skill
        const proficiencyLevel = proficiencyLevels[Math.floor(Math.random() * proficiencyLevels.length)];
        const proficiencyScore = 
          proficiencyLevel === 'beginner' ? Math.random() * 0.25 + 0.1 :  // 0.1-0.35
          proficiencyLevel === 'intermediate' ? Math.random() * 0.25 + 0.36 : // 0.36-0.6
          proficiencyLevel === 'advanced' ? Math.random() * 0.20 + 0.61 : // 0.61-0.8
          Math.random() * 0.19 + 0.81; // 0.81-0.99
        
        skillRecords.push({
          id: uuidv4(),
          employee_id: employeeId,
          skill_name: skill,
          proficiency_level: proficiencyLevel,
          proficiency_score: Number(proficiencyScore.toFixed(2)),
          verified: Math.random() > 0.7, // 30% chance of being verified
          verified_by: null,
          verified_at: Math.random() > 0.7 ? new Date() : null,
          last_demonstrated: new Date(Date.now() - Math.floor(Math.random() * 90) * 24 * 60 * 60 * 1000), // Random date in last 90 days
          associated_courses: [],
          created_at: new Date(),
          updated_at: new Date()
        });
      }
    }
    
    // Always add some Soft Skills for everyone
    const softSkills = skillsByCategory['Soft Skills']
      .sort(() => 0.5 - Math.random())
      .slice(0, 3); // Everyone gets 3 soft skills
    
    for (const skill of softSkills) {
      const proficiencyLevel = proficiencyLevels[Math.floor(Math.random() * proficiencyLevels.length)];
      const proficiencyScore = 
        proficiencyLevel === 'beginner' ? Math.random() * 0.25 + 0.1 :
        proficiencyLevel === 'intermediate' ? Math.random() * 0.25 + 0.36 :
        proficiencyLevel === 'advanced' ? Math.random() * 0.20 + 0.61 :
        Math.random() * 0.19 + 0.81;
      
      skillRecords.push({
        id: uuidv4(),
        employee_id: employeeId,
        skill_name: skill,
        proficiency_level: proficiencyLevel,
        proficiency_score: Number(proficiencyScore.toFixed(2)),
        verified: Math.random() > 0.7,
        verified_by: null,
        verified_at: Math.random() > 0.7 ? new Date() : null,
        last_demonstrated: new Date(Date.now() - Math.floor(Math.random() * 90) * 24 * 60 * 60 * 1000),
        associated_courses: [],
        created_at: new Date(),
        updated_at: new Date()
      });
    }
  }
  
  try {
    // Insert skill records
    const { data, error } = await supabase
      .from('skill_records')
      .insert(skillRecords)
      .select('id');
      
    if (error) throw error;
    
    console.log(`Successfully seeded ${data.length} skill records`);
    return data.map(record => record.id);
  } catch (error) {
    console.error('Error seeding skill records:', error);
    return [];
  }
};

/**
 * Seeds the career_goals table with sample data
 */
export const seedCareerGoals = async (employeeIds: string[]) => {
  console.log('Seeding career goals...');
  
  if (!employeeIds || employeeIds.length === 0) {
    console.warn('No employee IDs provided for career goals seeding');
    return [];
  }
  
  // Sample career goal templates
  const goalTemplates = [
    {
      title: 'Become a Team Lead',
      description: 'Develop leadership skills necessary to lead a development team effectively',
      relatedSkills: ['Team Leadership', 'Communication', 'Project Management', 'Conflict Resolution'],
      requiredCourses: []
    },
    {
      title: 'Master Cloud Architecture',
      description: 'Become proficient in designing and implementing cloud-based solutions',
      relatedSkills: ['AWS', 'Azure', 'Cloud Architecture', 'Infrastructure as Code', 'DevOps'],
      requiredCourses: []
    },
    {
      title: 'Transition to Product Management',
      description: 'Develop skills required to move from a technical role to product management',
      relatedSkills: ['Product Strategy', 'User Research', 'Roadmap Planning', 'Stakeholder Management', 'Agile'],
      requiredCourses: []
    },
    {
      title: 'Improve Public Speaking',
      description: 'Become more confident and effective when presenting to groups or clients',
      relatedSkills: ['Presentation', 'Communication', 'Storytelling', 'Confidence'],
      requiredCourses: []
    },
    {
      title: 'Learn Machine Learning',
      description: 'Develop skills in machine learning algorithms and applications',
      relatedSkills: ['Python', 'Data Science', 'Machine Learning', 'Statistics', 'Algorithm Design'],
      requiredCourses: []
    }
  ];
  
  // Generate 1-3 career goals for each employee
  const careerGoals = [];
  
  for (const employeeId of employeeIds) {
    // Determine how many goals this employee has (1-3)
    const goalCount = Math.floor(Math.random() * 3) + 1;
    
    // Randomly select goals from templates
    const selectedGoals = goalTemplates
      .sort(() => 0.5 - Math.random())
      .slice(0, goalCount);
    
    for (let i = 0; i < selectedGoals.length; i++) {
      const goal = selectedGoals[i];
      
      // Determine status based on position in the list
      let status = 'active';
      if (i === 0 && Math.random() > 0.7) {
        status = 'completed'; // 30% chance first goal is completed
      } else if (i === selectedGoals.length - 1 && Math.random() > 0.8) {
        status = 'deferred'; // 20% chance last goal is deferred
      }
      
      // Generate a target date (1-12 months in the future)
      const targetDate = new Date();
      targetDate.setMonth(targetDate.getMonth() + Math.floor(Math.random() * 12) + 1);
      
      // Determine progress based on status
      let progress = 0;
      if (status === 'completed') {
        progress = 1;
      } else if (status === 'active') {
        progress = Number((Math.random() * 0.8).toFixed(2)); // 0-80% progress
      }
      
      careerGoals.push({
        id: uuidv4(),
        employee_id: employeeId,
        title: goal.title,
        description: goal.description,
        target_date: targetDate,
        related_skills: goal.relatedSkills,
        required_courses: goal.requiredCourses,
        progress,
        status,
        created_at: new Date(),
        updated_at: new Date()
      });
    }
  }
  
  try {
    // Insert career goals
    const { data, error } = await supabase
      .from('career_goals')
      .insert(careerGoals)
      .select('id');
      
    if (error) throw error;
    
    console.log(`Successfully seeded ${data.length} career goals`);
    return data.map(goal => goal.id);
  } catch (error) {
    console.error('Error seeding career goals:', error);
    return [];
  }
};

/**
 * Seeds the learning_history table with sample data
 */
export const seedLearningHistory = async (employeeIds: string[]) => {
  console.log('Seeding learning history...');
  
  if (!employeeIds || employeeIds.length === 0) {
    console.warn('No employee IDs provided for learning history seeding');
    return [];
  }
  
  // Sample activity types and related items
  const activityTypes = [
    'course_started',
    'module_completed',
    'assessment_taken',
    'skill_gained',
    'intervention_received'
  ];
  
  const relatedItems = [
    { name: 'JavaScript Fundamentals', id: uuidv4() },
    { name: 'React for Beginners', id: uuidv4() },
    { name: 'Advanced TypeScript', id: uuidv4() },
    { name: 'Database Design Principles', id: uuidv4() },
    { name: 'Leadership for Technical Teams', id: uuidv4() },
    { name: 'Communication Skills', id: uuidv4() },
    { name: 'Project Management', id: uuidv4() },
    { name: 'UX Design Principles', id: uuidv4() }
  ];
  
  // Generate 5-15 history items for each employee
  const historyItems = [];
  
  for (const employeeId of employeeIds) {
    // Determine how many history items this employee has (5-15)
    const itemCount = Math.floor(Math.random() * 11) + 5;
    
    for (let i = 0; i < itemCount; i++) {
      // Select random activity type and related item
      const activityType = activityTypes[Math.floor(Math.random() * activityTypes.length)];
      const relatedItem = relatedItems[Math.floor(Math.random() * relatedItems.length)];
      
      // Determine completion status based on activity type
      let completionStatus = null;
      if (activityType === 'course_started') {
        completionStatus = Math.random() > 0.7 ? 'completed' : 'in_progress';
      } else if (activityType === 'module_completed') {
        completionStatus = 'completed';
      } else if (activityType === 'assessment_taken') {
        completionStatus = Math.random() > 0.2 ? 'completed' : 'failed';
      }
      
      // Generate a score for applicable activities
      let score = null;
      if (activityType === 'assessment_taken' && completionStatus === 'completed') {
        score = Math.floor(Math.random() * 30) + 70; // 70-100
      } else if (activityType === 'module_completed') {
        score = Math.floor(Math.random() * 40) + 60; // 60-100
      }
      
      // Generate activity date (within the last 180 days)
      const activityDate = new Date();
      activityDate.setDate(activityDate.getDate() - Math.floor(Math.random() * 180));
      
      historyItems.push({
        id: uuidv4(),
        employee_id: employeeId,
        activity_type: activityType,
        related_item_id: relatedItem.id,
        related_item_name: relatedItem.name,
        completion_status: completionStatus,
        score,
        time_spent: Math.floor(Math.random() * 120) + 10, // 10-130 minutes
        activity_date: activityDate,
        created_at: activityDate
      });
    }
  }
  
  try {
    // Insert learning history items
    const { data, error } = await supabase
      .from('learning_history')
      .insert(historyItems)
      .select('id');
      
    if (error) throw error;
    
    console.log(`Successfully seeded ${data.length} learning history items`);
    return data.map(item => item.id);
  } catch (error) {
    console.error('Error seeding learning history:', error);
    return [];
  }
};

/**
 * Main function to seed all employee-related data
 */
export const seedAllEmployeeData = async () => {
  console.log('Starting to seed employee-related data...');
  
  try {
    // 1. Create employees
    const employeeIds = await seedEmployees();
    
    // 2. Create learning preferences for each employee
    await seedLearningPreferences(employeeIds);
    
    // 3. Create skill records for each employee
    await seedSkillRecords(employeeIds);
    
    // 4. Create career goals for each employee
    await seedCareerGoals(employeeIds);
    
    // 5. Create learning history for each employee
    await seedLearningHistory(employeeIds);
    
    console.log('✅ Successfully seeded all employee-related data');
    return true;
  } catch (error) {
    console.error('❌ Error in employee seed process:', error);
    return false;
  }
}; 