import React from "@/lib/react-helpers";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/state";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";

const TestNotificationButton: React.FC = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = React.useState(false);

  const addTestNotifications = async () => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "No user found. Please log in.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Create test notifications matching the table structure
      const notifications = [
        {
          recipient_id: user.id,
          title: 'New Course Content Available',
          message: 'We\'ve added new content to your JavaScript Fundamentals course. Check it out now!',
          is_read: false,
          action_link: '/dashboard/courses',
          created_at: new Date().toISOString()
        },
        {
          recipient_id: user.id,
          title: 'Assignment Due Tomorrow',
          message: 'Your React module assignment is due tomorrow. Make sure to submit it on time!',
          is_read: false,
          created_at: new Date().toISOString()
        },
        {
          recipient_id: user.id,
          title: 'We Value Your Feedback',
          message: 'Please take a moment to provide feedback on the Machine Learning module you recently completed.',
          is_read: false,
          action_link: '/dashboard/feedback',
          created_at: new Date().toISOString()
        }
      ];

      // Insert all notifications
      const { error } = await supabase
        .from('notifications')
        .insert(notifications);

      if (error) throw error;

      toast({
        title: "Success!",
        description: "3 test notifications have been added. Refresh the page to see them.",
      });
    } catch (error) {
      console.error("Error adding test notifications:", error);
      toast({
        title: "Error",
        description: `Failed to add test notifications: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      onClick={addTestNotifications} 
      disabled={isLoading}
      variant="outline"
      className="mt-4"
    >
      {isLoading ? "Adding..." : "Add Test Notifications"}
    </Button>
  );
};

export default TestNotificationButton; 