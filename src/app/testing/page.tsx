import React from 'react';

export default function TestingPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Learnfinity Test Console</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Data Population Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Data Population</h2>
          <p className="text-gray-600 mb-4">
            Populate your database with test data to enable comprehensive testing of both the HR Dashboard
            and AI Agent functionality.
          </p>
          
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded border">
              <h3 className="font-medium">Database Population Script</h3>
              <p className="text-sm text-gray-500 mt-1">
                Run this script to create realistic test data in your database
              </p>
              <div className="mt-2">
                <code className="bg-gray-100 text-sm p-2 rounded block">
                  ./src/scripts/populate-test-data.sh
                </code>
              </div>
            </div>
            
            <div className="bg-blue-50 p-4 rounded border border-blue-100">
              <h3 className="font-medium text-blue-800">What Data Will Be Created?</h3>
              <ul className="list-disc list-inside text-sm text-blue-700 mt-2 space-y-1">
                <li>25 HR employees across different departments</li>
                <li>9 learning paths with varying content</li>
                <li>20 courses connected to learning paths</li>
                <li>Learning path assignments for each employee</li>
                <li>Course enrollments with varied progress</li>
                <li>Agent activities showing AI interactions</li>
              </ul>
            </div>
          </div>
        </div>
        
        {/* AI Testing Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">AI Agent Testing</h2>
          <p className="text-gray-600 mb-4">
            Use these endpoints to test AI agent functionality with real employee data
          </p>
          
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded border">
              <h3 className="font-medium">Learning Path Generation</h3>
              <p className="text-sm text-gray-500 mt-1">
                Test AI-generated personalized learning paths
              </p>
              <div className="mt-2">
                <code className="bg-gray-100 text-sm p-2 rounded block overflow-x-auto">
                  POST /api/test/ai-agent<br />
                  &#123;<br />
                  &nbsp;&nbsp;"testType": "learning_path",<br />
                  &nbsp;&nbsp;"employeeEmail": "alex.chen@test.learnfinity.com"<br />
                  &#125;
                </code>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded border">
              <h3 className="font-medium">RAG Status Determination</h3>
              <p className="text-sm text-gray-500 mt-1">
                Test AI analysis of learner progress and RAG status
              </p>
              <div className="mt-2">
                <code className="bg-gray-100 text-sm p-2 rounded block overflow-x-auto">
                  POST /api/test/ai-agent<br />
                  &#123;<br />
                  &nbsp;&nbsp;"testType": "rag_status",<br />
                  &nbsp;&nbsp;"employeeEmail": "emma.williams@test.learnfinity.com"<br />
                  &#125;
                </code>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded border">
              <h3 className="font-medium">Intervention Suggestions</h3>
              <p className="text-sm text-gray-500 mt-1">
                Test AI-generated interventions for at-risk learners
              </p>
              <div className="mt-2">
                <code className="bg-gray-100 text-sm p-2 rounded block overflow-x-auto">
                  POST /api/test/ai-agent<br />
                  &#123;<br />
                  &nbsp;&nbsp;"testType": "intervention",<br />
                  &nbsp;&nbsp;"employeeEmail": "david.kim@test.learnfinity.com"<br />
                  &#125;
                </code>
              </div>
            </div>
          </div>
        </div>
        
        {/* HR Dashboard Testing Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">HR Dashboard Testing</h2>
          <p className="text-gray-600 mb-4">
            Test the HR Dashboard with real data
          </p>
          
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded border">
              <h3 className="font-medium">Employee Management</h3>
              <p className="text-sm text-gray-500 mt-1">
                Verify real-time data loading in the HR Dashboard
              </p>
              <div className="mt-2">
                <a href="/hr" className="inline-block bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 transition-colors">
                  Open HR Dashboard
                </a>
              </div>
            </div>
            
            <div className="bg-blue-50 p-4 rounded border border-blue-100">
              <h3 className="font-medium text-blue-800">What to Test?</h3>
              <ul className="list-disc list-inside text-sm text-blue-700 mt-2 space-y-1">
                <li>Employee listing with filtering and sorting</li>
                <li>Learning path assignments to employees</li>
                <li>Progress tracking across departments</li>
                <li>RAG status visualization and intervention tools</li>
                <li>Dashboard metrics and analytics</li>
              </ul>
            </div>
          </div>
        </div>
        
        {/* Resources & Documentation */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Resources & Documentation</h2>
          <p className="text-gray-600 mb-4">
            Helpful resources for understanding the test data and functionality
          </p>
          
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded border">
              <h3 className="font-medium">Database Schema</h3>
              <p className="text-sm text-gray-500 mt-1">
                Key tables used in the HR-Learner connection
              </p>
              <ul className="list-disc list-inside text-sm mt-2 space-y-1">
                <li>hr_employees - Employee records</li>
                <li>learning_paths - Available learning paths</li>
                <li>learning_path_assignments - Path assignments to users</li>
                <li>course_enrollments - User progress in courses</li>
                <li>agent_activities - AI agent interaction logs</li>
              </ul>
            </div>
            
            <div className="bg-gray-50 p-4 rounded border">
              <h3 className="font-medium">Testing Process</h3>
              <ol className="list-decimal list-inside text-sm mt-2 space-y-1">
                <li>Run the data population script</li>
                <li>Test HR Dashboard with real data</li>
                <li>Test AI agent endpoints</li>
                <li>Verify agent activities in the database</li>
                <li>Review learner progress and interventions</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 