/**
 * Assessment Data Seeding Utility
 * 
 * This script populates the database with sample assessment data for development and testing.
 */

import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/lib/supabase-client';
import { TABLES } from '@/utils/database/schema/assessments';

/**
 * Seeds the question_bank table with sample questions
 */
export const seedQuestionBank = async () => {
  console.log('Seeding question bank...');
  
  const questions = [
    // Multiple choice questions
    {
      id: uuidv4(),
      type: 'multiple_choice',
      text: 'Which of the following is NOT a JavaScript data type?',
      points: 1,
      difficulty_level: 'beginner',
      skills: ['JavaScript', 'Programming Basics'],
      explanation: 'JavaScript has primitive data types like String, Number, Boolean, Null, Undefined, Symbol, and BigInt, plus the Object reference type. Class is a syntax for creating objects but not a data type itself.',
      hint: 'Think about the built-in primitive and reference types in JavaScript.',
      tags: ['javascript', 'basics', 'data types'],
      content: {
        options: [
          'String',
          'Number',
          'Boolean',
          'Class'
        ],
        correctOptionIndex: 3,
        randomizeOptions: true
      },
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: uuidv4(),
      type: 'multiple_choice',
      text: 'Which React hook is used to perform side effects in function components?',
      points: 1,
      difficulty_level: 'intermediate',
      skills: ['React', 'Hooks'],
      explanation: 'useEffect is the React hook used for performing side effects in function components, such as data fetching, subscriptions, or manually changing the DOM.',
      hint: 'Think about what you would use instead of componentDidMount or componentDidUpdate in class components.',
      tags: ['react', 'hooks', 'lifecycle'],
      content: {
        options: [
          'useState',
          'useEffect',
          'useContext',
          'useReducer'
        ],
        correctOptionIndex: 1,
        randomizeOptions: true
      },
      created_at: new Date(),
      updated_at: new Date()
    },
    
    // Multiple select questions
    {
      id: uuidv4(),
      type: 'multiple_select',
      text: 'Which of the following are valid ways to create objects in JavaScript? (Select all that apply)',
      points: 2,
      difficulty_level: 'intermediate',
      skills: ['JavaScript', 'Objects'],
      explanation: 'JavaScript offers multiple ways to create objects including object literals, constructor functions, classes, and Object.create().',
      hint: 'Think about the different syntaxes for object creation introduced across JavaScript versions.',
      tags: ['javascript', 'objects'],
      content: {
        options: [
          'Using object literals: const obj = {}',
          'Using constructor functions: const obj = new MyObject()',
          'Using classes: const obj = new MyClass()',
          'Using Object.create(): const obj = Object.create(proto)',
          'Using object(): const obj = object()'
        ],
        correctOptionIndices: [0, 1, 2, 3],
        minSelectedOptions: 1,
        maxSelectedOptions: 5,
        randomizeOptions: true
      },
      created_at: new Date(),
      updated_at: new Date()
    },
    
    // True/False questions
    {
      id: uuidv4(),
      type: 'true_false',
      text: 'In React, components must always return a single root element.',
      points: 1,
      difficulty_level: 'beginner',
      skills: ['React', 'Components'],
      explanation: 'In React, components must return a single root element, though this can be a fragment (<> or <React.Fragment>) that contains multiple elements.',
      hint: 'Think about the fundamental structure of a React component return statement.',
      tags: ['react', 'components', 'jsx'],
      content: {
        isTrue: true
      },
      created_at: new Date(),
      updated_at: new Date()
    },
    
    // Short answer questions
    {
      id: uuidv4(),
      type: 'short_answer',
      text: 'What CSS property is used to change the text color of an element?',
      points: 1,
      difficulty_level: 'beginner',
      skills: ['CSS', 'Styling'],
      explanation: 'The color property is used to set the text color in CSS.',
      hint: 'This is a fundamental CSS property for text styling.',
      tags: ['css', 'styling', 'text'],
      content: {
        correctAnswers: ['color', 'color:', 'color: value'],
        caseSensitive: false,
        maxLength: 100
      },
      created_at: new Date(),
      updated_at: new Date()
    },
    
    // Long answer questions
    {
      id: uuidv4(),
      type: 'long_answer',
      text: 'Explain the concept of closures in JavaScript and provide an example of how they can be useful.',
      points: 3,
      difficulty_level: 'advanced',
      skills: ['JavaScript', 'Closures', 'Advanced Concepts'],
      explanation: 'Closures are functions that remember the environment in which they were created, allowing them to access variables from an outer function even after that function has finished executing.',
      hint: 'Think about function scope and how inner functions can access variables from their containing function.',
      tags: ['javascript', 'closures', 'advanced'],
      content: {
        rubric: [
          {
            criteria: 'Clear explanation of closures',
            maxPoints: 1
          },
          {
            criteria: 'Correct example demonstrating closures',
            maxPoints: 1
          },
          {
            criteria: 'Explanation of practical use case',
            maxPoints: 1
          }
        ],
        minLength: 50,
        maxLength: 500,
        sampleAnswer: `A closure is a function that has access to its outer function's scope even after the outer function has returned. This happens because the inner function maintains a reference to the outer function's scope. Closures are useful for data encapsulation and creating private variables. For example, you can use closures to create a counter function that maintains its count between calls:

function createCounter() { 
  let count = 0; 
  return function() { 
    return ++count; 
  }; 
} 

const counter = createCounter(); 
console.log(counter()); // 1 
console.log(counter()); // 2`
      },
      created_at: new Date(),
      updated_at: new Date()
    },
    
    // Matching questions
    {
      id: uuidv4(),
      type: 'matching',
      text: 'Match each HTTP status code with its meaning:',
      points: 2,
      difficulty_level: 'intermediate',
      skills: ['Web Development', 'HTTP'],
      explanation: 'HTTP status codes indicate the result of the HTTP request. 200 means OK, 404 means Not Found, 500 means Internal Server Error, and 301 means Moved Permanently.',
      hint: 'Think about common HTTP status codes you encounter when developing web applications.',
      tags: ['http', 'status codes', 'web'],
      content: {
        leftItems: ['200', '404', '500', '301'],
        rightItems: ['OK', 'Not Found', 'Internal Server Error', 'Moved Permanently'],
        correctPairs: [[0, 0], [1, 1], [2, 2], [3, 3]],
        randomizeItems: true
      },
      created_at: new Date(),
      updated_at: new Date()
    }
  ];
  
  try {
    // Insert questions
    const { data, error } = await supabase
      .from('question_bank')
      .insert(questions)
      .select('id');
      
    if (error) throw error;
    
    console.log(`Successfully seeded ${data.length} questions`);
    return data.map(question => question.id);
  } catch (error) {
    console.error('Error seeding question bank:', error);
    return [];
  }
};

/**
 * Seeds the assessments table with sample assessments
 */
export const seedAssessments = async (courseIds: string[], questionIds: string[]) => {
  console.log('Seeding assessments...');
  
  if (!courseIds || courseIds.length === 0) {
    console.warn('No course IDs provided for assessment seeding');
    return [];
  }
  
  if (!questionIds || questionIds.length === 0) {
    console.warn('No question IDs provided for assessment seeding');
    return [];
  }
  
  // Create assessments for each course
  const assessments = [];
  
  for (let i = 0; i < courseIds.length; i++) {
    const courseId = courseIds[i];
    
    // Create a quiz assessment
    assessments.push({
      id: uuidv4(),
      title: `Module 1 Quiz - ${i + 1}`,
      description: 'Test your understanding of the core concepts from Module 1',
      type: 'quiz',
      questions: questionIds.slice(0, 5), // Use first 5 questions
      total_points: 5,
      time_limit: 15, // 15 minutes
      randomize_questions: true,
      questions_per_attempt: 5,
      grading_criteria: {
        passingScore: 3,
        passingPercentage: 60,
        maxAttempts: 3,
        showCorrectAnswers: true,
        showExplanations: true
      },
      course_id: courseId,
      module_id: null, // Would be set in a real implementation
      section_id: null,
      is_published: true,
      created_at: new Date(),
      updated_at: new Date()
    });
    
    // Create a final assessment
    assessments.push({
      id: uuidv4(),
      title: `Final Assessment - ${i + 1}`,
      description: 'Comprehensive assessment covering all material in this course',
      type: 'exam',
      questions: questionIds, // Use all questions
      total_points: questionIds.length,
      time_limit: 60, // 60 minutes
      randomize_questions: true,
      questions_per_attempt: questionIds.length,
      grading_criteria: {
        passingScore: Math.ceil(questionIds.length * 0.7),
        passingPercentage: 70,
        maxAttempts: 2,
        showCorrectAnswers: false,
        showExplanations: true,
        gradingDelay: 60 // Show results after 1 hour
      },
      course_id: courseId,
      module_id: null,
      section_id: null,
      is_published: true,
      created_at: new Date(),
      updated_at: new Date()
    });
  }
  
  try {
    // Insert assessments
    const { data, error } = await supabase
      .from('assessments')
      .insert(assessments)
      .select('id');
      
    if (error) throw error;
    
    console.log(`Successfully seeded ${data.length} assessments`);
    return data.map(assessment => assessment.id);
  } catch (error) {
    console.error('Error seeding assessments:', error);
    return [];
  }
};

/**
 * Seeds the assessment_attempts table with sample attempts
 */
export const seedAssessmentAttempts = async (assessmentIds: string[]) => {
  console.log('Seeding assessment attempts...');
  
  if (!assessmentIds || assessmentIds.length === 0) {
    console.warn('No assessment IDs provided for attempt seeding');
    return [];
  }
  
  // For now, we'll create mock attempts without real user IDs
  // In a real implementation, you would use actual user IDs
  const mockUserId = 'b6e03a7d-5c6b-4c0a-8b3c-4d7d1a7d7b9e';
  
  const attempts = [];
  
  for (const assessmentId of assessmentIds) {
    // Create 1-3 attempts per assessment
    const attemptCount = Math.floor(Math.random() * 3) + 1;
    
    for (let attemptNum = 1; attemptNum <= attemptCount; attemptNum++) {
      const startedAt = new Date();
      startedAt.setDate(startedAt.getDate() - (attemptCount - attemptNum + 1)); // Earlier attempts in the past
      
      const submittedAt = new Date(startedAt);
      submittedAt.setMinutes(submittedAt.getMinutes() + 10 + Math.floor(Math.random() * 20)); // 10-30 minutes duration
      
      const timeSpent = Math.floor((submittedAt.getTime() - startedAt.getTime()) / 1000); // in seconds
      
      const score = 60 + Math.floor(Math.random() * 40); // Score between 60-100
      const percentage = score;
      const passed = score >= 70;
      
      attempts.push({
        id: uuidv4(),
        assessment_id: assessmentId,
        user_id: mockUserId,
        responses: [
          {
            questionId: uuidv4(), // Mock question ID
            responseData: { selectedOptionIndex: 2 },
            startedAt: new Date(startedAt),
            submittedAt: new Date(startedAt.getTime() + 2 * 60 * 1000), // 2 minutes later
            timeSpent: 120 // 2 minutes in seconds
          },
          {
            questionId: uuidv4(), // Mock question ID
            responseData: { selectedOptionIndex: 0 },
            startedAt: new Date(startedAt.getTime() + 2 * 60 * 1000),
            submittedAt: new Date(startedAt.getTime() + 5 * 60 * 1000), // 3 minutes later
            timeSpent: 180 // 3 minutes in seconds
          }
          // More responses would be added in a real implementation
        ],
        score,
        percentage,
        passed,
        started_at: startedAt,
        submitted_at: submittedAt,
        graded_at: submittedAt, // Auto-graded immediately
        graded_by: 'auto',
        time_spent: timeSpent,
        feedback: passed ? 'Good job!' : 'Review the material and try again.',
        attempt_number: attemptNum,
        created_at: startedAt,
        updated_at: submittedAt
      });
    }
  }
  
  try {
    // Insert attempts
    const { data, error } = await supabase
      .from('assessment_attempts')
      .insert(attempts)
      .select('id');
      
    if (error) throw error;
    
    console.log(`Successfully seeded ${data.length} assessment attempts`);
    return data.map(attempt => attempt.id);
  } catch (error) {
    console.error('Error seeding assessment attempts:', error);
    return [];
  }
};

/**
 * Main function to seed all assessment-related data
 */
export const seedAllAssessmentData = async (courseIds: string[] = []) => {
  console.log('Starting to seed assessment-related data...');
  
  try {
    // 1. Create questions in the question bank
    const questionIds = await seedQuestionBank();
    
    if (courseIds.length === 0) {
      console.warn('No course IDs provided. Skipping assessment creation.');
      return true;
    }
    
    // 2. Create assessments for each course
    const assessmentIds = await seedAssessments(courseIds, questionIds);
    
    // 3. Create assessment attempts
    await seedAssessmentAttempts(assessmentIds);
    
    console.log('✅ Successfully seeded all assessment-related data');
    return true;
  } catch (error) {
    console.error('❌ Error in assessment seed process:', error);
    return false;
  }
};

/**
 * Seed function for creating sample assessment data with the new schema
 */
export async function seedAssessmentsV2() {
  console.log('Seeding assessments data with new schema...');

  try {
    // Sample assessments data
    const assessments = [
      {
        title: 'Introduction to Company Policies',
        description: 'Test your knowledge of our core company policies and procedures.',
        passing_score: 70,
        time_limit_minutes: 20,
        is_required: true,
        status: 'active',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        title: 'Health and Safety Certification',
        description: 'Mandatory assessment for all employees to ensure workplace safety compliance.',
        passing_score: 80,
        time_limit_minutes: 30,
        is_required: true,
        status: 'active',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        title: 'Customer Service Excellence',
        description: 'Evaluate your understanding of our customer service principles and practices.',
        passing_score: 75,
        time_limit_minutes: 25,
        is_required: false,
        status: 'active',
        created_at: new Date(),
        updated_at: new Date(),
      },
    ];

    // Insert assessments
    for (const assessment of assessments) {
      const { data: assessmentData, error: assessmentError } = await supabase
        .from(TABLES.ASSESSMENTS)
        .insert(assessment)
        .select('id')
        .single();

      if (assessmentError) {
        console.error(`Error inserting assessment "${assessment.title}":`, assessmentError);
        continue;
      }

      const assessmentId = assessmentData.id;
      console.log(`Created assessment: ${assessment.title} (${assessmentId})`);

      // Create questions based on assessment type
      let questions = [];

      if (assessment.title === 'Introduction to Company Policies') {
        questions = [
          {
            assessment_id: assessmentId,
            question_text: 'What is the primary goal of our company\'s code of conduct?',
            question_type: 'multiple_choice',
            options: ['Maximize profits', 'Ensure regulatory compliance', 'Create an ethical work environment', 'Reduce legal liability'],
            correct_answer: ['Create an ethical work environment'],
            points: 10,
            order: 1,
          },
          {
            assessment_id: assessmentId,
            question_text: 'How many days of notice are required before taking planned leave?',
            question_type: 'multiple_choice',
            options: ['7 days', '14 days', '30 days', 'No notice required'],
            correct_answer: ['14 days'],
            points: 10,
            order: 2,
          },
          {
            assessment_id: assessmentId,
            question_text: 'Our company has a zero-tolerance policy for workplace discrimination.',
            question_type: 'true_false',
            correct_answer: 'true',
            points: 10,
            order: 3,
          },
          {
            assessment_id: assessmentId,
            question_text: 'What should you do if you witness a potential violation of company policy?',
            question_type: 'multiple_choice',
            options: ['Ignore it', 'Report it to HR', 'Confront the person directly', 'Discuss it with colleagues'],
            correct_answer: ['Report it to HR'],
            points: 10,
            order: 4,
          },
        ];
      } else if (assessment.title === 'Health and Safety Certification') {
        questions = [
          {
            assessment_id: assessmentId,
            question_text: 'Where are fire extinguishers located in the building?',
            question_type: 'multiple_choice',
            options: ['Only in the kitchen', 'At each emergency exit', 'Only in the server room', 'In the manager\'s office'],
            correct_answer: ['At each emergency exit'],
            points: 10,
            order: 1,
          },
          {
            assessment_id: assessmentId,
            question_text: 'What is the correct procedure for reporting a workplace injury?',
            question_type: 'short_answer',
            points: 15,
            order: 2,
          },
          {
            assessment_id: assessmentId,
            question_text: 'Regular workplace safety training is mandatory for all employees.',
            question_type: 'true_false',
            correct_answer: 'true',
            points: 10,
            order: 3,
          },
          {
            assessment_id: assessmentId,
            question_text: 'Which of the following are required safety equipment for laboratory work?',
            question_type: 'multiple_choice',
            options: ['Safety glasses', 'Lab coat', 'Gloves', 'All of the above'],
            correct_answer: ['All of the above'],
            points: 10,
            order: 4,
          },
        ];
      } else if (assessment.title === 'Customer Service Excellence') {
        questions = [
          {
            assessment_id: assessmentId,
            question_text: 'What is the most important aspect of customer service?',
            question_type: 'multiple_choice',
            options: ['Speed', 'Accuracy', 'Empathy', 'Technical knowledge'],
            correct_answer: ['Empathy'],
            points: 10,
            order: 1,
          },
          {
            assessment_id: assessmentId,
            question_text: 'How should you respond to an angry customer?',
            question_type: 'multiple_choice',
            options: ['Respond with equal emotion', 'Transfer them to a manager immediately', 'Listen actively and acknowledge their concerns', 'Ask them to call back when calmer'],
            correct_answer: ['Listen actively and acknowledge their concerns'],
            points: 15,
            order: 2,
          },
          {
            assessment_id: assessmentId,
            question_text: 'It\'s acceptable to make promises to customers that you\'re not sure the company can fulfill.',
            question_type: 'true_false',
            correct_answer: 'false',
            points: 10,
            order: 3,
          },
          {
            assessment_id: assessmentId,
            question_text: 'Describe a strategy for turning a negative customer experience into a positive one.',
            question_type: 'short_answer',
            points: 15,
            order: 4,
          },
        ];
      }

      // Insert questions
      for (const question of questions) {
        const { error: questionError } = await supabase
          .from(TABLES.ASSESSMENT_QUESTIONS)
          .insert(question);

        if (questionError) {
          console.error(`Error inserting question for assessment ${assessmentId}:`, questionError);
        }
      }

      console.log(`Added ${questions.length} questions to assessment: ${assessment.title}`);
    }

    console.log('Assessment seeding completed successfully');
    return true;
  } catch (error) {
    console.error('Error seeding assessments:', error);
    return false;
  }
} 