/**
 * Assessment Service
 * Service for managing assessment content, questions, and attempts
 */

import {
  AssessmentData,
  AssessmentType,
  Question,
  QuestionType,
  GradingCriteria,
  MultipleChoiceQuestion,
  AssessmentAttempt,
  QuestionResponse,
  AssessmentResults
} from '../types/assessment.types';
import { DifficultyLevel } from '../types/course.types';

// Mock data for demonstration purposes
const mockAssessments: AssessmentData[] = [
  {
    id: 'assessment-001',
    title: 'JavaScript Fundamentals Quiz',
    description: 'Test your knowledge of basic JavaScript concepts',
    type: AssessmentType.QUIZ,
    questions: [], // Will be populated from mockQuestions
    totalPoints: 15, // Will be calculated from questions
    timeLimit: 20, // minutes
    randomizeQuestions: true,
    gradingCriteria: {
      id: 'criteria-001',
      passingScore: 10,
      passingPercentage: 70,
      maxAttempts: 3,
      showCorrectAnswers: true,
      showExplanations: true,
      createdAt: new Date('2023-11-10'),
      updatedAt: new Date('2023-11-10')
    },
    courseId: 'course-001',
    moduleId: 'module-001',
    isPublished: true,
    createdBy: 'author-001',
    createdAt: new Date('2023-11-10'),
    updatedAt: new Date('2023-11-15')
  },
  {
    id: 'assessment-002',
    title: 'React Components Exam',
    description: 'Comprehensive assessment of React component knowledge',
    type: AssessmentType.EXAM,
    questions: [], // Will be populated from mockQuestions
    totalPoints: 50, // Will be calculated from questions
    timeLimit: 60, // minutes
    randomizeQuestions: false,
    gradingCriteria: {
      id: 'criteria-002',
      passingScore: 35,
      passingPercentage: 70,
      maxAttempts: 2,
      showCorrectAnswers: false,
      showExplanations: false,
      gradingDelay: 1440, // 24 hours
      createdAt: new Date('2023-12-05'),
      updatedAt: new Date('2023-12-10')
    },
    courseId: 'course-002',
    moduleId: 'module-003',
    isPublished: true,
    createdBy: 'author-002',
    createdAt: new Date('2023-12-05'),
    updatedAt: new Date('2024-01-15')
  }
];

const mockQuestions: Record<string, Question[]> = {
  'assessment-001': [
    {
      id: 'question-001',
      type: QuestionType.MULTIPLE_CHOICE,
      text: 'Which JavaScript keyword is used to declare a variable that cannot be reassigned?',
      points: 3,
      difficultyLevel: DifficultyLevel.BEGINNER,
      skills: ['JavaScript', 'Variables'],
      explanation: 'The const keyword is used to declare variables that cannot be reassigned. Variables declared with let can be reassigned, and var is the traditional way to declare variables.',
      options: ['var', 'let', 'const', 'def'],
      correctOptionIndex: 2,
      randomizeOptions: true,
      tags: ['variables', 'basics'],
      createdAt: new Date('2023-11-10'),
      updatedAt: new Date('2023-11-10')
    },
    {
      id: 'question-002',
      type: QuestionType.TRUE_FALSE,
      text: 'JavaScript is a statically typed language.',
      points: 2,
      difficultyLevel: DifficultyLevel.BEGINNER,
      skills: ['JavaScript', 'Programming Concepts'],
      explanation: 'JavaScript is a dynamically typed language, meaning variable types are determined at runtime.',
      isTrue: false,
      tags: ['basics', 'concepts'],
      createdAt: new Date('2023-11-10'),
      updatedAt: new Date('2023-11-10')
    },
    {
      id: 'question-003',
      type: QuestionType.MULTIPLE_SELECT,
      text: 'Which of the following are valid ways to create a function in JavaScript?',
      points: 5,
      difficultyLevel: DifficultyLevel.INTERMEDIATE,
      skills: ['JavaScript', 'Functions'],
      explanation: 'JavaScript provides multiple ways to define functions: function declarations, function expressions, and arrow functions.',
      options: [
        'function myFunc() {}',
        'const myFunc = function() {}',
        'const myFunc = () => {}',
        'function: myFunc() {}'
      ],
      correctOptionIndices: [0, 1, 2],
      minSelectedOptions: 1,
      maxSelectedOptions: 4,
      randomizeOptions: false,
      tags: ['functions', 'intermediate'],
      createdAt: new Date('2023-11-10'),
      updatedAt: new Date('2023-11-12')
    },
    {
      id: 'question-004',
      type: QuestionType.SHORT_ANSWER,
      text: 'What JavaScript method is used to add an element to the end of an array?',
      points: 3,
      difficultyLevel: DifficultyLevel.BEGINNER,
      skills: ['JavaScript', 'Arrays'],
      explanation: 'The push() method adds elements to the end of an array, while unshift() adds to the beginning.',
      correctAnswers: ['push', 'push()', 'array.push()', '.push()'],
      caseSensitive: false,
      maxLength: 20,
      tags: ['arrays', 'methods'],
      createdAt: new Date('2023-11-11'),
      updatedAt: new Date('2023-11-11')
    },
    {
      id: 'question-005',
      type: QuestionType.CODE_ENTRY,
      text: 'Write a JavaScript function that returns the sum of two numbers.',
      points: 5,
      difficultyLevel: DifficultyLevel.BEGINNER,
      skills: ['JavaScript', 'Functions', 'Arithmetic'],
      explanation: 'A basic function that takes two parameters and returns their sum.',
      language: 'javascript',
      starterCode: 'function sum(a, b) {\n  // Your code here\n}',
      correctCode: [
        'function sum(a, b) {\n  return a + b;\n}',
        'function sum(a, b) {\n  const result = a + b;\n  return result;\n}'
      ],
      testCases: [
        { input: 'sum(2, 3)', expectedOutput: '5' },
        { input: 'sum(-1, 1)', expectedOutput: '0' },
        { input: 'sum(0, 0)', expectedOutput: '0' }
      ],
      executionTimeLimit: 1000,
      tags: ['functions', 'coding'],
      createdAt: new Date('2023-11-12'),
      updatedAt: new Date('2023-11-15')
    }
  ],
  'assessment-002': [
    // React assessment questions would go here
  ]
};

const mockAttempts: AssessmentAttempt[] = [
  {
    id: 'attempt-001',
    assessmentId: 'assessment-001',
    userId: 'user-001',
    responses: [
      {
        questionId: 'question-001',
        responseData: 2, // Selected option index
        startedAt: new Date('2024-01-15T10:30:00Z'),
        submittedAt: new Date('2024-01-15T10:30:45Z'),
        timeSpent: 45 // seconds
      },
      {
        questionId: 'question-002',
        responseData: false, // True/False answer
        startedAt: new Date('2024-01-15T10:31:00Z'),
        submittedAt: new Date('2024-01-15T10:31:30Z'),
        timeSpent: 30 // seconds
      }
      // More responses...
    ],
    score: 12,
    percentage: 80,
    passed: true,
    startedAt: new Date('2024-01-15T10:30:00Z'),
    submittedAt: new Date('2024-01-15T10:35:30Z'),
    gradedAt: new Date('2024-01-15T10:35:35Z'),
    gradedBy: 'auto',
    timeSpent: 330, // seconds
    attemptNumber: 1,
    createdAt: new Date('2024-01-15T10:30:00Z'),
    updatedAt: new Date('2024-01-15T10:35:35Z')
  }
];

// Assign questions to assessments
for (const assessmentId in mockQuestions) {
  const assessmentIndex = mockAssessments.findIndex(a => a.id === assessmentId);
  if (assessmentIndex >= 0) {
    mockAssessments[assessmentIndex].questions = mockQuestions[assessmentId];
    
    // Calculate total points
    mockAssessments[assessmentIndex].totalPoints = mockQuestions[assessmentId].reduce(
      (total, question) => total + question.points, 0
    );
  }
}

/**
 * Service for managing assessments and questions
 */
export class AssessmentService {
  /**
   * Get all assessments
   */
  async getAllAssessments(): Promise<AssessmentData[]> {
    // In a real implementation, this would query the database
    return [...mockAssessments];
  }

  /**
   * Get an assessment by ID
   */
  async getAssessmentById(assessmentId: string): Promise<AssessmentData | null> {
    // In a real implementation, this would query the database
    const assessment = mockAssessments.find(a => a.id === assessmentId);
    return assessment ? { ...assessment } : null;
  }

  /**
   * Get assessments for a course
   */
  async getAssessmentsByCourse(courseId: string): Promise<AssessmentData[]> {
    // In a real implementation, this would query the database
    return mockAssessments.filter(a => a.courseId === courseId);
  }

  /**
   * Get assessments for a module
   */
  async getAssessmentsByModule(moduleId: string): Promise<AssessmentData[]> {
    // In a real implementation, this would query the database
    return mockAssessments.filter(a => a.moduleId === moduleId);
  }

  /**
   * Create a new assessment
   */
  async createAssessment(data: Partial<AssessmentData>): Promise<AssessmentData> {
    // In a real implementation, this would insert into the database
    const newAssessment: AssessmentData = {
      id: `assessment-${Date.now()}`,
      title: data.title || 'Untitled Assessment',
      description: data.description || '',
      type: data.type || AssessmentType.QUIZ,
      questions: [],
      totalPoints: 0,
      timeLimit: data.timeLimit,
      randomizeQuestions: data.randomizeQuestions ?? true,
      questionsPerAttempt: data.questionsPerAttempt,
      gradingCriteria: data.gradingCriteria || {
        id: `criteria-${Date.now()}`,
        passingScore: 70,
        passingPercentage: 70,
        showCorrectAnswers: true,
        showExplanations: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      courseId: data.courseId,
      moduleId: data.moduleId,
      sectionId: data.sectionId,
      isPublished: false,
      createdBy: data.createdBy || 'unknown',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    mockAssessments.push(newAssessment);
    mockQuestions[newAssessment.id] = [];
    
    return newAssessment;
  }

  /**
   * Update an assessment
   */
  async updateAssessment(
    assessmentId: string, 
    data: Partial<AssessmentData>
  ): Promise<AssessmentData | null> {
    // In a real implementation, this would update the database
    const assessmentIndex = mockAssessments.findIndex(a => a.id === assessmentId);
    
    if (assessmentIndex >= 0) {
      mockAssessments[assessmentIndex] = {
        ...mockAssessments[assessmentIndex],
        ...data,
        updatedAt: new Date()
      };
      
      return mockAssessments[assessmentIndex];
    }
    
    return null;
  }

  /**
   * Add a question to an assessment
   */
  async addQuestionToAssessment(
    assessmentId: string, 
    questionData: Partial<Question> & { type: QuestionType }
  ): Promise<Question | null> {
    // In a real implementation, this would insert into the database
    const assessment = mockAssessments.find(a => a.id === assessmentId);
    
    if (!assessment) return null;
    
    if (!mockQuestions[assessmentId]) {
      mockQuestions[assessmentId] = [];
    }
    
    // Create base question properties
    const baseQuestion = {
      id: `question-${Date.now()}`,
      text: questionData.text || 'Untitled Question',
      points: questionData.points || 1,
      difficultyLevel: questionData.difficultyLevel || DifficultyLevel.BEGINNER,
      skills: questionData.skills || [],
      explanation: questionData.explanation,
      hint: questionData.hint,
      tags: questionData.tags || [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Finalize question based on type
    let question: Question;
    
    switch (questionData.type) {
      case QuestionType.MULTIPLE_CHOICE:
        question = {
          ...baseQuestion,
          type: QuestionType.MULTIPLE_CHOICE,
          options: (questionData as Partial<MultipleChoiceQuestion>).options || ['Option 1', 'Option 2'],
          correctOptionIndex: (questionData as Partial<MultipleChoiceQuestion>).correctOptionIndex || 0,
          randomizeOptions: (questionData as Partial<MultipleChoiceQuestion>).randomizeOptions
        };
        break;
      
      // Other question types would be handled here
      
      default:
        // Type assertion for demonstration - in a real implementation, more types would be supported
        question = {
          ...baseQuestion,
          type: questionData.type,
          ...questionData
        } as Question;
    }
    
    mockQuestions[assessmentId].push(question);
    
    // Update assessment references
    const assessmentIndex = mockAssessments.findIndex(a => a.id === assessmentId);
    mockAssessments[assessmentIndex].questions = mockQuestions[assessmentId];
    mockAssessments[assessmentIndex].totalPoints = mockQuestions[assessmentId].reduce(
      (total, q) => total + q.points, 0
    );
    
    return question;
  }

  /**
   * Get all questions for an assessment
   */
  async getQuestionsByAssessment(assessmentId: string): Promise<Question[]> {
    // In a real implementation, this would query the database
    return mockQuestions[assessmentId] || [];
  }

  /**
   * Submit an assessment attempt
   */
  async submitAttempt(
    assessmentId: string,
    userId: string,
    responses: QuestionResponse[]
  ): Promise<AssessmentAttempt> {
    // In a real implementation, this would insert into the database
    // and trigger automatic grading
    
    const assessment = await this.getAssessmentById(assessmentId);
    if (!assessment) {
      throw new Error('Assessment not found');
    }
    
    // Calculate score - in a real implementation, this would have complex grading logic
    const score = 12; // Example score
    const percentage = (score / assessment.totalPoints) * 100;
    const passed = percentage >= assessment.gradingCriteria.passingPercentage;
    
    // Get existing attempts for this user and assessment
    const existingAttempts = mockAttempts.filter(
      a => a.assessmentId === assessmentId && a.userId === userId
    );
    const attemptNumber = existingAttempts.length + 1;
    
    const now = new Date();
    const startedAt = responses.length > 0 
      ? responses.reduce((earliest, resp) => 
          resp.startedAt < earliest ? resp.startedAt : earliest, 
          responses[0].startedAt)
      : new Date(now.getTime() - 300000); // Default 5 minutes ago
    
    const submittedAt = now;
    const timeSpent = Math.floor((submittedAt.getTime() - startedAt.getTime()) / 1000);
    
    const newAttempt: AssessmentAttempt = {
      id: `attempt-${Date.now()}`,
      assessmentId,
      userId,
      responses,
      score,
      percentage,
      passed,
      startedAt,
      submittedAt,
      gradedAt: now, // Auto-graded immediately for this example
      gradedBy: 'auto',
      timeSpent,
      attemptNumber,
      createdAt: now,
      updatedAt: now
    };
    
    mockAttempts.push(newAttempt);
    
    return newAttempt;
  }

  /**
   * Get attempts for a user on an assessment
   */
  async getUserAttempts(assessmentId: string, userId: string): Promise<AssessmentAttempt[]> {
    // In a real implementation, this would query the database
    return mockAttempts.filter(
      a => a.assessmentId === assessmentId && a.userId === userId
    );
  }

  /**
   * Get assessment results for analysis
   */
  async getAssessmentResults(assessmentId: string): Promise<AssessmentResults | null> {
    // In a real implementation, this would aggregate data from attempts
    const attempts = mockAttempts.filter(a => a.assessmentId === assessmentId);
    
    if (attempts.length === 0) return null;
    
    // Example analysis - in a real implementation, this would have more complex calculations
    const totalAttempts = attempts.length;
    const scores = attempts.map(a => a.score);
    const averageScore = scores.reduce((sum, score) => sum + score, 0) / totalAttempts;
    const medianScore = scores.sort((a, b) => a - b)[Math.floor(totalAttempts / 2)];
    const passCount = attempts.filter(a => a.passed).length;
    const passRate = passCount / totalAttempts;
    const timesSpent = attempts.map(a => a.timeSpent);
    const averageTimeSpent = timesSpent.reduce((sum, time) => sum + time, 0) / totalAttempts;
    
    // Simplified question stats for the example
    const questionStats = mockQuestions[assessmentId]?.map(q => ({
      questionId: q.id,
      questionText: q.text,
      correctRate: 0.75, // Example value
      averageTimeSpent: 45, // Example value (seconds)
      difficulty: 0.4 // Example value (0-1)
    })) || [];
    
    return {
      assessmentId,
      totalAttempts,
      averageScore,
      medianScore,
      passRate,
      averageTimeSpent,
      questionStats
    };
  }
}

// Export singleton instance
export const assessmentService = new AssessmentService(); 