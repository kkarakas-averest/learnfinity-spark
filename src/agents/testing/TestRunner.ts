/**
 * Agent Test Runner
 * 
 * A command-line utility for running agent tests and displaying results.
 * This can be used to validate agent behavior during development or in CI/CD pipelines.
 */

import { AgentTestFramework } from './AgentTestFramework';
import { registerRAGStatusTests } from './RAGStatusTests';
import { AgentFactory } from '../AgentFactory';

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',
  hidden: '\x1b[8m',
  
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  
  bgBlack: '\x1b[40m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
  bgWhite: '\x1b[47m'
};

/**
 * Main test runner function
 */
async function runTests() {
  console.log(`${colors.bright}${colors.cyan}=== Agent Test Runner ====${colors.reset}\n`);
  
  try {
    // Initialize the agent factory
    console.log(`${colors.dim}Initializing agent factory...${colors.reset}`);
    const agentFactory = AgentFactory.getInstance();
    await agentFactory.initializeRAGCrew(true);
    
    // Initialize the test framework
    console.log(`${colors.dim}Initializing test framework...${colors.reset}`);
    const testFramework = AgentTestFramework.getInstance();
    
    // Register test cases
    console.log(`${colors.dim}Registering test cases...${colors.reset}`);
    const ragStatusTestIds = registerRAGStatusTests(testFramework);
    console.log(`${colors.green}✓ Registered ${ragStatusTestIds.length} RAG status tests${colors.reset}`);
    
    // Run all tests
    console.log(`\n${colors.bright}${colors.white}Running tests...${colors.reset}\n`);
    const startTime = Date.now();
    const results = await testFramework.runAllTests();
    const endTime = Date.now();
    
    // Display results
    console.log(`\n${colors.bright}${colors.white}Test Results:${colors.reset}\n`);
    
    results.forEach((result, index) => {
      const statusColor = result.passed ? colors.green : colors.red;
      const statusSymbol = result.passed ? '✓' : '✗';
      
      console.log(`${statusColor}${statusSymbol} Test ${index + 1}: ${result.testCaseName}${colors.reset}`);
      console.log(`   Agent: ${result.agentType}`);
      console.log(`   Response time: ${result.responseTime}ms`);
      
      if (result.error) {
        console.log(`   ${colors.red}Error: ${result.error.message}${colors.reset}`);
      }
      
      console.log(`   Validation Results:`);
      result.validationResults.forEach(validation => {
        const validationColor = validation.passed ? colors.green : colors.red;
        const validationSymbol = validation.passed ? '✓' : '✗';
        console.log(`     ${validationColor}${validationSymbol} ${validation.ruleName}${colors.reset}`);
        if (validation.message && !validation.passed) {
          console.log(`       ${colors.yellow}${validation.message}${colors.reset}`);
        }
      });
      
      console.log(''); // Empty line between test results
    });
    
    // Display summary
    const report = testFramework.generateTestReport();
    const totalTime = endTime - startTime;
    
    console.log(`${colors.bright}${colors.white}Summary:${colors.reset}`);
    console.log(`Total tests: ${report.totalTests}`);
    console.log(`Passed: ${colors.green}${report.passedTests}${colors.reset}`);
    console.log(`Failed: ${report.failedTests > 0 ? colors.red : colors.green}${report.failedTests}${colors.reset}`);
    console.log(`Average response time: ${report.averageResponseTime.toFixed(2)}ms`);
    console.log(`Total execution time: ${totalTime}ms`);
    
    // Clean up
    agentFactory.cleanup();
    
    // Exit with appropriate code
    if (report.failedTests > 0) {
      console.log(`\n${colors.red}${colors.bright}Tests failed!${colors.reset}`);
      process.exit(1);
    } else {
      console.log(`\n${colors.green}${colors.bright}All tests passed!${colors.reset}`);
      process.exit(0);
    }
  } catch (error) {
    console.error(`${colors.red}${colors.bright}Error running tests:${colors.reset}`, error);
    process.exit(1);
  }
}

// Run the tests if this file is executed directly
if (require.main === module) {
  runTests().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

export { runTests }; 