/**
 * RAG Status Tests
 * 
 * Test cases for validating the RAG status determination functionality
 * of the analyzer agent.
 */

import { AgentTestFramework } from './AgentTestFramework';
import { ValidationRules } from './ValidationRules';

/**
 * Register RAG status test cases with the test framework
 */
export function registerRAGStatusTests(framework: AgentTestFramework): string[] {
  const testIds: string[] = [];
  
  // Test case 1: Employee with clear red status indicators
  testIds.push(framework.registerTestCase({
    name: 'Red Status Determination',
    description: 'Tests that an employee with clear red indicators is correctly classified',
    agentType: 'analyzer',
    input: {
      employeeData: {
        id: 'emp001',
        name: 'John Doe',
        department: 'Engineering',
        completedModules: 2,
        totalModules: 15,
        lastActivityDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
        deadlinesMissed: 4,
        assessmentScores: [45, 52, 48],
        feedbackResponses: [
          { question: 'How confident are you with the material?', response: 'Not confident at all' },
          { question: 'Are you facing any challenges?', response: 'Yes, I find the content very difficult' }
        ]
      }
    },
    validationRules: [
      ValidationRules.hasRequiredFields(['status', 'confidence', 'reasons']),
      ValidationRules.validRAGStatus('status'),
      ValidationRules.fieldEquals('status', 'red'),
      ValidationRules.numberInRange('confidence', 0.7, 1.0),
      ValidationRules.arrayMinLength('reasons', 2)
    ],
    timeout: 10000 // 10 seconds
  }));
  
  // Test case 2: Employee with clear amber status indicators
  testIds.push(framework.registerTestCase({
    name: 'Amber Status Determination',
    description: 'Tests that an employee with clear amber indicators is correctly classified',
    agentType: 'analyzer',
    input: {
      employeeData: {
        id: 'emp002',
        name: 'Jane Smith',
        department: 'Marketing',
        completedModules: 8,
        totalModules: 15,
        lastActivityDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
        deadlinesMissed: 2,
        assessmentScores: [65, 72, 68],
        feedbackResponses: [
          { question: 'How confident are you with the material?', response: 'Somewhat confident' },
          { question: 'Are you facing any challenges?', response: 'Some parts are challenging' }
        ]
      }
    },
    validationRules: [
      ValidationRules.hasRequiredFields(['status', 'confidence', 'reasons']),
      ValidationRules.validRAGStatus('status'),
      ValidationRules.fieldEquals('status', 'amber'),
      ValidationRules.numberInRange('confidence', 0.6, 1.0),
      ValidationRules.arrayMinLength('reasons', 1)
    ],
    timeout: 10000 // 10 seconds
  }));
  
  // Test case 3: Employee with clear green status indicators
  testIds.push(framework.registerTestCase({
    name: 'Green Status Determination',
    description: 'Tests that an employee with clear green indicators is correctly classified',
    agentType: 'analyzer',
    input: {
      employeeData: {
        id: 'emp003',
        name: 'Alex Johnson',
        department: 'Sales',
        completedModules: 14,
        totalModules: 15,
        lastActivityDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        deadlinesMissed: 0,
        assessmentScores: [88, 92, 85],
        feedbackResponses: [
          { question: 'How confident are you with the material?', response: 'Very confident' },
          { question: 'Are you facing any challenges?', response: 'No major challenges' }
        ]
      }
    },
    validationRules: [
      ValidationRules.hasRequiredFields(['status', 'confidence', 'reasons']),
      ValidationRules.validRAGStatus('status'),
      ValidationRules.fieldEquals('status', 'green'),
      ValidationRules.numberInRange('confidence', 0.7, 1.0),
      ValidationRules.arrayMinLength('reasons', 1)
    ],
    timeout: 10000 // 10 seconds
  }));
  
  // Test case 4: Edge case with mixed indicators
  testIds.push(framework.registerTestCase({
    name: 'Mixed Indicators Status Determination',
    description: 'Tests that an employee with mixed indicators is classified with appropriate confidence level',
    agentType: 'analyzer',
    input: {
      employeeData: {
        id: 'emp004',
        name: 'Sam Wilson',
        department: 'Customer Support',
        completedModules: 10,
        totalModules: 15,
        lastActivityDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
        deadlinesMissed: 1,
        assessmentScores: [75, 62, 88],
        feedbackResponses: [
          { question: 'How confident are you with the material?', response: 'Confident with most parts' },
          { question: 'Are you facing any challenges?', response: 'Struggling with some advanced topics' }
        ]
      }
    },
    validationRules: [
      ValidationRules.hasRequiredFields(['status', 'confidence', 'reasons']),
      ValidationRules.validRAGStatus('status'),
      // We don't validate the exact status since it's a mixed case
      ValidationRules.numberInRange('confidence', 0.5, 0.9), // Lower confidence expected
      ValidationRules.arrayMinLength('reasons', 2)
    ],
    timeout: 10000 // 10 seconds
  }));
  
  // Test case 5: Minimal data case
  testIds.push(framework.registerTestCase({
    name: 'Minimal Data Status Determination',
    description: 'Tests that the agent can handle cases with minimal data',
    agentType: 'analyzer',
    input: {
      employeeData: {
        id: 'emp005',
        name: 'Pat Taylor',
        department: 'HR',
        completedModules: 5,
        totalModules: 15
        // Missing other data points
      }
    },
    validationRules: [
      ValidationRules.hasRequiredFields(['status', 'confidence', 'reasons']),
      ValidationRules.validRAGStatus('status'),
      ValidationRules.numberInRange('confidence', 0.3, 0.8), // Lower confidence due to limited data
      ValidationRules.custom(
        'incomplete-data-handling',
        'Checks that the agent acknowledges the incomplete data',
        (result) => {
          const hasIncompleteDataMessage = result.reasons.some(
            (reason: string) => reason.toLowerCase().includes('incomplete') || 
                               reason.toLowerCase().includes('missing') ||
                               reason.toLowerCase().includes('limited')
          );
          
          return {
            valid: hasIncompleteDataMessage,
            message: hasIncompleteDataMessage 
              ? 'Agent correctly acknowledged incomplete data' 
              : 'Agent failed to acknowledge incomplete data in reasons'
          };
        }
      )
    ],
    timeout: 10000 // 10 seconds
  }));
  
  return testIds;
} 