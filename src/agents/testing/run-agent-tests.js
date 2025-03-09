#!/usr/bin/env node

/**
 * Agent Test Runner Script
 * 
 * This script provides a command-line interface for running agent tests.
 * It can be executed directly from the command line.
 * 
 * Usage:
 *   node run-agent-tests.js [options]
 * 
 * Options:
 *   --filter=<pattern>  Only run tests matching the pattern
 *   --verbose           Show detailed output
 *   --mock              Run in mock mode (no real agent processing)
 */

// Register TypeScript compiler
require('ts-node').register({
  transpileOnly: true,
  compilerOptions: {
    module: 'commonjs',
    target: 'es2020',
    esModuleInterop: true,
  },
});

// Import the test runner
const { runTests } = require('./TestRunner');

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  filter: null,
  verbose: false,
  mock: false,
};

args.forEach(arg => {
  if (arg.startsWith('--filter=')) {
    options.filter = arg.split('=')[1];
  } else if (arg === '--verbose') {
    options.verbose = true;
  } else if (arg === '--mock') {
    options.mock = true;
  } else if (arg === '--help' || arg === '-h') {
    console.log(`
Agent Test Runner

Usage:
  node run-agent-tests.js [options]

Options:
  --filter=<pattern>  Only run tests matching the pattern
  --verbose           Show detailed output
  --mock              Run in mock mode (no real agent processing)
  --help, -h          Show this help message
    `);
    process.exit(0);
  }
});

// Set environment variables based on options
if (options.verbose) {
  process.env.AGENT_TEST_VERBOSE = 'true';
}

if (options.mock) {
  process.env.AGENT_TEST_MOCK = 'true';
}

if (options.filter) {
  process.env.AGENT_TEST_FILTER = options.filter;
}

// Run the tests
runTests().catch(error => {
  console.error('Failed to run tests:', error);
  process.exit(1);
}); 