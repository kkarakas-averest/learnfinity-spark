import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

const SupabaseAuthTest = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Test Supabase connection
  const testConnection = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, email')
        .limit(1);
      
      if (error) {
        throw error;
      }
      
      setResult({
        success: true,
        message: 'Connection successful!',
        data
      });
    } catch (err: any) {
      console.error('Connection test error:', err);
      setError(err.message || 'An unknown error occurred');
      setResult({
        success: false,
        message: 'Connection failed',
        error: err
      });
    } finally {
      setLoading(false);
    }
  };

  // Test login
  const testLogin = async () => {
    if (!email || !password) {
      setError('Please provide both email and password');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      console.log('Testing login with:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      setResult({
        success: true,
        message: 'Login successful!',
        user: data.user,
        session: data.session
      });
    } catch (err: any) {
      console.error('Login test error:', err);
      setError(err.message || 'An unknown error occurred');
      setResult({
        success: false,
        message: 'Login failed',
        error: err
      });
    } finally {
      setLoading(false);
    }
  };

  // Check environment variables
  const checkEnvVars = () => {
    const supabaseUrl = 'https://ujlqzkkkfatehxeqtbdl.supabase.co';
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    setResult({
      success: true,
      message: 'Environment check',
      supabaseUrl,
      supabaseKeyDefined: !!supabaseAnonKey,
      supabaseKeyLength: supabaseAnonKey ? supabaseAnonKey.length : 'undefined',
      viteMode: import.meta.env.MODE
    });
  };

  return (
    <div className="container mx-auto py-10">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Supabase Auth Diagnostic Tool</CardTitle>
          <CardDescription>
            Use this tool to test Supabase authentication and connection
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Button onClick={testConnection} disabled={loading} variant="outline" className="mr-2">
              {loading ? 'Testing...' : 'Test Connection'}
            </Button>
            <Button onClick={checkEnvVars} disabled={loading} variant="outline">
              Check Environment
            </Button>
          </div>
          
          <div className="space-y-2">
            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
              />
            </div>
          </div>
          
          <Button onClick={testLogin} disabled={loading || !email || !password} className="w-full">
            {loading ? 'Testing Login...' : 'Test Login'}
          </Button>
          
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md border border-red-200">
              {error}
            </div>
          )}
          
          {result && (
            <div className={`p-4 rounded-md ${result.success ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'}`}>
              <h3 className="font-medium mb-2">{result.message}</h3>
              <pre className="text-xs overflow-auto p-2 bg-slate-50 rounded">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
        <CardFooter className="text-sm text-gray-500">
          This tool is for diagnostic purposes only. Do not use with production credentials.
        </CardFooter>
      </Card>
    </div>
  );
};

export default SupabaseAuthTest; 