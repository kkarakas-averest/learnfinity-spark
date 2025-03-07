import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

/**
 * Supabase Diagnostic Component
 * Can be added to any page for debugging Supabase connection issues
 */
export function SupabaseDiagnostic() {
  const [diagResults, setDiagResults] = useState({
    configCheck: { status: 'pending' },
    authCheck: { status: 'pending' },
    tableChecks: {}
  });
  const [userData, setUserData] = useState({
    publicUsers: null,
    employees: null,
    status: 'pending'
  });
  const [showDetails, setShowDetails] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [activeTab, setActiveTab] = useState('diagnostics');

  // Helper to check config
  const checkSupabaseConfig = async () => {
    const supabaseUrl = 'https://ujlqzkkkfatehxeqtbdl.supabase.co';
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    const configResult = {
      status: 'complete',
      url: supabaseUrl,
      keyPresent: !!supabaseAnonKey,
      keyLength: supabaseAnonKey ? supabaseAnonKey.length : 0,
      keyValid: typeof supabaseAnonKey === 'string' && supabaseAnonKey.length >= 20,
      configured: isSupabaseConfigured(),
      clientInitialized: !!supabase && typeof supabase.from === 'function'
    };
    
    setDiagResults(prev => ({
      ...prev,
      configCheck: configResult
    }));
    
    return configResult;
  };

  // Helper to check auth
  const checkAuth = async () => {
    try {
      setDiagResults(prev => ({
        ...prev,
        authCheck: { status: 'running' }
      }));
      
      const { data, error } = await supabase.auth.getSession();
      
      const authResult = {
        status: 'complete',
        success: !error,
        error: error ? error.message : null,
        sessionPresent: !!data?.session
      };
      
      setDiagResults(prev => ({
        ...prev,
        authCheck: authResult
      }));
      
      return authResult;
    } catch (err) {
      const authResult = {
        status: 'complete',
        success: false,
        error: `Exception: ${err.message}`,
        sessionPresent: false
      };
      
      setDiagResults(prev => ({
        ...prev,
        authCheck: authResult
      }));
      
      return authResult;
    }
  };

  // Helper to check tables
  const checkTables = async () => {
    const tables = ['users', 'hr_departments', 'hr_positions', 'hr_employees'];
    const tableChecks = {};
    
    for (const table of tables) {
      setDiagResults(prev => ({
        ...prev,
        tableChecks: {
          ...prev.tableChecks,
          [table]: { status: 'running' }
        }
      }));
      
      try {
        const { data, error } = await supabase
          .from(table)
          .select('id')
          .limit(1);
        
        const tableResult = {
          status: 'complete',
          success: !error,
          error: error ? `${error.code}: ${error.message}` : null,
          rowCount: data?.length || 0,
          firstId: data && data.length > 0 ? data[0].id : null
        };
        
        setDiagResults(prev => ({
          ...prev,
          tableChecks: {
            ...prev.tableChecks,
            [table]: tableResult
          }
        }));
      } catch (err) {
        const tableResult = {
          status: 'complete',
          success: false,
          error: `Exception: ${err.message}`,
          rowCount: 0
        };
        
        setDiagResults(prev => ({
          ...prev,
          tableChecks: {
            ...prev.tableChecks,
            [table]: tableResult
          }
        }));
      }
    }
  };

  // Function to load users from database
  const loadUsers = async () => {
    setIsLoadingUsers(true);
    setUserData({ publicUsers: null, employees: null, status: 'loading' });
    
    try {
      // Load employees from hr_employees table
      const { data: employees, error: employeesError } = await supabase
        .from('hr_employees')
        .select('*')
        .order('created_at', { ascending: false });
      
      // Load users from users table
      const { data: publicUsers, error: publicUsersError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
      
      setUserData({
        employees: employeesError ? null : employees,
        employeesError: employeesError ? employeesError.message : null,
        publicUsers: publicUsersError ? null : publicUsers,
        publicUsersError: publicUsersError ? publicUsersError.message : null,
        status: 'complete'
      });
    } catch (err) {
      setUserData({
        status: 'error',
        error: err.message
      });
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Run all diagnostic checks
  const runDiagnostics = async () => {
    setIsRunning(true);
    
    // Reset results
    setDiagResults({
      configCheck: { status: 'pending' },
      authCheck: { status: 'pending' },
      tableChecks: {}
    });
    
    const configResult = await checkSupabaseConfig();
    
    // Only proceed if config looks good
    if (configResult.clientInitialized) {
      await checkAuth();
      await checkTables();
    }
    
    setIsRunning(false);
  };

  // Run diagnostics on component mount
  useEffect(() => {
    if (activeTab === 'diagnostics') {
      runDiagnostics();
    }
  }, [activeTab]);

  // Status helpers
  const getConfigStatus = () => {
    const { configCheck } = diagResults;
    if (configCheck.status !== 'complete') return 'Pending';
    return configCheck.configured && configCheck.clientInitialized ? 'Good' : 'Error';
  };
  
  const getAuthStatus = () => {
    const { authCheck } = diagResults;
    if (authCheck.status !== 'complete') return 'Pending';
    return authCheck.success ? 'Good' : 'Error';
  };
  
  const getTablesStatus = () => {
    const { tableChecks } = diagResults;
    const tables = Object.keys(tableChecks);
    if (tables.length === 0) return 'Pending';
    
    const errorTables = tables.filter(table => 
      tableChecks[table].status === 'complete' && !tableChecks[table].success
    );
    
    return errorTables.length === 0 ? 'Good' : `${errorTables.length} issues`;
  };

  // UI helpers for status indicators
  const statusBadge = (status) => {
    let color;
    switch (status) {
      case 'Good': color = 'bg-green-100 text-green-800'; break;
      case 'Error': color = 'bg-red-100 text-red-800'; break;
      default: color = 'bg-gray-100 text-gray-800';
    }
    
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${color}`}>
        {status}
      </span>
    );
  };

  return (
    <Card className="w-full max-w-3xl mx-auto my-4">
      <CardHeader>
        <CardTitle>Supabase Diagnostics</CardTitle>
        <CardDescription>Check Supabase configuration, connectivity, and user data</CardDescription>
      </CardHeader>
      
      <Tabs defaultValue="diagnostics" value={activeTab} onValueChange={setActiveTab}>
        <div className="px-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="diagnostics">Connection Diagnostics</TabsTrigger>
            <TabsTrigger value="users">User Data</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="diagnostics" className="pt-2">
          <CardContent>
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="font-medium">Configuration:</div>
              <div className="text-right">{statusBadge(getConfigStatus())}</div>
              
              <div className="font-medium">Auth API:</div>
              <div className="text-right">{statusBadge(getAuthStatus())}</div>
              
              <div className="font-medium">Database Tables:</div>
              <div className="text-right">{statusBadge(getTablesStatus())}</div>
            </div>
            
            {showDetails && (
              <div className="mt-4 p-3 bg-gray-50 rounded text-sm font-mono whitespace-pre-wrap">
                {JSON.stringify(diagResults, null, 2)}
              </div>
            )}
          </CardContent>
          
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? 'Hide Details' : 'Show Details'}
            </Button>
            <Button
              onClick={runDiagnostics}
              disabled={isRunning}
            >
              {isRunning ? 'Running...' : 'Run Diagnostics'}
            </Button>
          </CardFooter>
        </TabsContent>
        
        <TabsContent value="users" className="pt-2">
          <CardContent>
            <div className="mb-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-medium">User Data</h3>
                <Button
                  size="sm"
                  onClick={loadUsers}
                  disabled={isLoadingUsers}
                >
                  {isLoadingUsers ? 'Loading...' : 'Refresh Data'}
                </Button>
              </div>
              
              {userData.status === 'loading' && (
                <div className="p-4 text-center">Loading user data...</div>
              )}
              
              {userData.status === 'error' && (
                <div className="p-4 text-center text-red-600">
                  Error loading user data: {userData.error}
                </div>
              )}
              
              {userData.status === 'complete' && (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Public Users Table {userData.publicUsersError && (
                      <span className="text-red-600 text-xs">Error: {userData.publicUsersError}</span>
                    )}</h4>
                    
                    {userData.publicUsers && userData.publicUsers.length > 0 ? (
                      <div className="overflow-auto max-h-40 border rounded">
                        <table className="min-w-full text-sm">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left">ID</th>
                              <th className="px-4 py-2 text-left">Name</th>
                              <th className="px-4 py-2 text-left">Email</th>
                              <th className="px-4 py-2 text-left">Role</th>
                              <th className="px-4 py-2 text-left">Created</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {userData.publicUsers.map((user, index) => (
                              <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                <td className="px-4 py-2 font-mono text-xs">{user.id.substring(0, 8)}...</td>
                                <td className="px-4 py-2">{user.name}</td>
                                <td className="px-4 py-2">{user.email}</td>
                                <td className="px-4 py-2">{user.role}</td>
                                <td className="px-4 py-2 text-xs">{new Date(user.created_at).toLocaleString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="p-2 bg-gray-50 rounded text-center">
                        {userData.publicUsersError 
                          ? 'Could not load users' 
                          : 'No users found in public.users table'}
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">HR Employees Table {userData.employeesError && (
                      <span className="text-red-600 text-xs">Error: {userData.employeesError}</span>
                    )}</h4>
                    
                    {userData.employees && userData.employees.length > 0 ? (
                      <div className="overflow-auto max-h-40 border rounded">
                        <table className="min-w-full text-sm">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left">ID</th>
                              <th className="px-4 py-2 text-left">Name</th>
                              <th className="px-4 py-2 text-left">Email</th>
                              <th className="px-4 py-2 text-left">Status</th>
                              <th className="px-4 py-2 text-left">Created</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {userData.employees.map((employee, index) => (
                              <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                <td className="px-4 py-2 font-mono text-xs">{employee.id.substring(0, 8)}...</td>
                                <td className="px-4 py-2">{employee.name}</td>
                                <td className="px-4 py-2">{employee.email}</td>
                                <td className="px-4 py-2">{employee.status}</td>
                                <td className="px-4 py-2 text-xs">{new Date(employee.created_at).toLocaleString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="p-2 bg-gray-50 rounded text-center">
                        {userData.employeesError 
                          ? 'Could not load employees' 
                          : 'No employees found in hr_employees table'}
                      </div>
                    )}
                  </div>
                  
                  <div className="bg-yellow-50 p-3 rounded">
                    <h4 className="font-medium mb-1">Data Analysis</h4>
                    {userData.publicUsers && userData.employees ? (
                      <div className="text-sm space-y-1">
                        <p>Employees without user records: <span className="font-medium">
                          {userData.employees.filter(employee => 
                            !userData.publicUsers.some(user => 
                              user.email === employee.email || user.id === employee.id
                            )
                          ).length}
                        </span></p>
                        <p>User records without employees: <span className="font-medium">
                          {userData.publicUsers.filter(user => 
                            !userData.employees.some(employee => 
                              employee.email === user.email || employee.id === user.id
                            )
                          ).length}
                        </span></p>
                      </div>
                    ) : (
                      <p className="text-sm">Data analysis not available</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </TabsContent>
      </Tabs>
    </Card>
  );
}

export default SupabaseDiagnostic; 