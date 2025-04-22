import React from "@/lib/react-helpers";
import { useState } from "@/lib/react-helpers";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useHRAuth } from "@/state";
import { Navigate } from "react-router-dom";

type SettingsTab = "general" | "notifications" | "advanced";

const SettingsPage: React.FC = () => {
  const { hrUser, isAuthenticated, isLoading } = useHRAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");
  
  // Redirect if not authenticated
  if (!isLoading && !isAuthenticated) {
    return <Navigate to="/hr-login" />;
  }
  
  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }
  
  return (
    <div className="container py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">HR Dashboard Settings</h1>
      </div>
      
      <Tabs 
        defaultValue="general" 
        value={activeTab}
        onValueChange={(value: string) => setActiveTab(value as SettingsTab)}
        className="w-full"
      >
        <TabsList className="grid grid-cols-3 w-full max-w-xl mb-6">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>HR Dashboard Settings</CardTitle>
              <CardDescription>
                Manage general settings for the HR dashboard
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-medium">User Information</h3>
                <p className="text-sm text-gray-500 mb-4">
                  You are logged in as: <span className="font-medium">{hrUser?.username}</span>
                </p>
                <Separator className="my-4" />
                <p className="text-sm text-gray-500">
                  This section will contain general settings like display preferences, 
                  timezone settings, and other basic configuration options.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Manage how and when you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">
                This section will allow configuration of notification types,
                frequency, and delivery methods. Coming soon.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Settings</CardTitle>
              <CardDescription>
                Configure advanced system settings (for administrators)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">
                This section contains advanced configuration options including
                data retention policies, system integration settings, and 
                export/import functionality. These advanced settings will be
                available in a future update.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage; 