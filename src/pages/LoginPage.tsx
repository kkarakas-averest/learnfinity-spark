
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { Lock, Mail, UserRound } from "lucide-react";

// Mock user database for demonstration
const mockUsers = [
  { email: "admin@learnfinity.com", password: "admin123", role: "superadmin" },
  { email: "hr@company.com", password: "hr123", role: "hr" },
  { email: "learner@company.com", password: "learner123", role: "learner" }
];

const LoginPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate API call delay
    setTimeout(() => {
      const user = mockUsers.find(user => user.email === email && user.password === password);

      if (user) {
        // In a real app, you would store tokens in localStorage or use a proper auth library
        localStorage.setItem("currentUser", JSON.stringify({ email: user.email, role: user.role }));
        
        toast({
          title: "Login Successful",
          description: "You have been successfully logged in.",
          variant: "default",
        });
        
        // Redirect based on role
        switch (user.role) {
          case "superadmin":
            navigate("/admin");
            break;
          case "hr":
            navigate("/hr");
            break;
          case "learner":
            navigate("/dashboard");
            break;
          default:
            navigate("/dashboard");
        }
      } else {
        toast({
          title: "Login Failed",
          description: "Invalid email or password. Please try again.",
          variant: "destructive",
        });
      }
      
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold">Learnfinity</CardTitle>
            <CardDescription>
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="demo">Demo Access</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="email" 
                        type="email" 
                        placeholder="name@example.com" 
                        className="pl-10"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="password" 
                        type="password" 
                        className="pl-10"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Logging in..." : "Log in"}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="demo">
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground text-center mb-4">
                    Select a demo account to quickly explore different user roles
                  </p>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start gap-2 mb-2"
                    onClick={() => {
                      setEmail("admin@learnfinity.com");
                      setPassword("admin123");
                    }}
                  >
                    <UserRound size={16} />
                    Super Admin
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start gap-2 mb-2"
                    onClick={() => {
                      setEmail("hr@company.com");
                      setPassword("hr123");
                    }}
                  >
                    <UserRound size={16} />
                    HR Manager
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start gap-2"
                    onClick={() => {
                      setEmail("learner@company.com");
                      setPassword("learner123");
                    }}
                  >
                    <UserRound size={16} />
                    Learner
                  </Button>
                  <Button type="submit" className="w-full mt-4" onClick={handleLogin} disabled={isLoading}>
                    {isLoading ? "Logging in..." : "Continue with Demo Account"}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="text-sm text-center text-muted-foreground">
              <span>Demo credentials for testing:</span>
              <ul className="mt-2 text-xs">
                <li>Super Admin: admin@learnfinity.com / admin123</li>
                <li>HR: hr@company.com / hr123</li>
                <li>Learner: learner@company.com / learner123</li>
              </ul>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
