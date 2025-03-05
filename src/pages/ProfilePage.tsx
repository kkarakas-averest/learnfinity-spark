
import * as React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { UserRole } from "@/lib/database.types";
import { Pencil, Save, User, Shield, GraduationCap, Building2, BookOpen } from "lucide-react";

const ProfilePage = () => {
  const { user, userDetails, isLoading } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: userDetails?.name || "",
    email: userDetails?.email || "",
  });

  // Redirect if not authenticated
  if (!isLoading && !user) {
    navigate("/login");
    return null;
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const handleEditToggle = () => {
    if (isEditing) {
      // If we're currently editing, save the changes
      toast({
        title: "Profile updated",
        description: "Your profile information has been saved.",
      });
    }
    setIsEditing(!isEditing);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData({
      ...profileData,
      [name]: value,
    });
  };

  // Function to render role badge with appropriate color
  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case "superadmin":
        return <Badge className="bg-red-500">{role}</Badge>;
      case "hr":
        return <Badge className="bg-blue-500">{role}</Badge>;
      case "mentor":
        return <Badge className="bg-green-500">{role}</Badge>;
      case "learner":
      default:
        return <Badge className="bg-purple-500">{role}</Badge>;
    }
  };

  // Function to get the icon for the role
  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case "superadmin":
        return <Shield className="h-5 w-5 text-red-500" />;
      case "hr":
        return <Building2 className="h-5 w-5 text-blue-500" />;
      case "mentor":
        return <GraduationCap className="h-5 w-5 text-green-500" />;
      case "learner":
      default:
        return <BookOpen className="h-5 w-5 text-purple-500" />;
    }
  };

  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <div className="container mx-auto py-10 px-4 md:px-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
          <div className="flex items-center gap-4 mb-4 md:mb-0">
            <Avatar className="h-20 w-20">
              <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userDetails?.name}`} alt={userDetails?.name} />
              <AvatarFallback>{userDetails?.name ? getInitials(userDetails.name) : <User />}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-bold">{userDetails?.name}</h1>
              <div className="flex items-center mt-1">
                {userDetails?.role && getRoleIcon(userDetails.role)}
                <span className="ml-2">{getRoleBadge(userDetails?.role || "learner")}</span>
              </div>
            </div>
          </div>
          <Button onClick={handleEditToggle} className="gap-2">
            {isEditing ? (
              <>
                <Save size={16} />
                Save Changes
              </>
            ) : (
              <>
                <Pencil size={16} />
                Edit Profile
              </>
            )}
          </Button>
        </div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>
                  Your personal information visible to others
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  {isEditing ? (
                    <Input
                      id="name"
                      name="name"
                      value={profileData.name}
                      onChange={handleInputChange}
                    />
                  ) : (
                    <div className="p-2 border rounded bg-muted/40">{profileData.name}</div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="p-2 border rounded bg-muted/40">{profileData.email}</div>
                </div>

                <div className="space-y-2">
                  <Label>User Role</Label>
                  <div className="p-2 border rounded bg-muted/40 capitalize">
                    {userDetails?.role || "learner"}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>User ID</Label>
                  <div className="p-2 border rounded bg-muted/40 text-xs font-mono overflow-auto">
                    {user?.id}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline">Reset</Button>
                <Button onClick={handleEditToggle}>
                  {isEditing ? "Save Changes" : "Edit"}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="account" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
                <CardDescription>
                  Manage your account settings and preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Account Status</Label>
                  <div className="p-2 border rounded bg-muted/40">
                    <Badge variant="success">Active</Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Account Created</Label>
                  <div className="p-2 border rounded bg-muted/40">
                    {user?.created_at ? new Date(user.created_at).toLocaleDateString() : "Unknown"}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Last Login</Label>
                  <div className="p-2 border rounded bg-muted/40">
                    {user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : "Unknown"}
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">
                  Change Password
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ProfilePage;
