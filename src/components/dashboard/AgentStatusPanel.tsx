import React from "@/lib/react-helpers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { CircleUserRound, MessageSquare, PhoneCall, Video } from "lucide-react";

const AgentStatusPanel = () => {
  // Mock data for agent status
  const agent = {
    name: "Alex Johnson",
    status: "Online",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
    recentActivity: [
      { type: "call", description: "Call with John Doe", time: "5 mins ago" },
      { type: "message", description: "Message from Jane Smith", time: "12 mins ago" },
      { type: "video", description: "Video call with Support Team", time: "30 mins ago" },
    ],
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "call":
        return <PhoneCall className="h-4 w-4 mr-2 text-green-500" />;
      case "message":
        return <MessageSquare className="h-4 w-4 mr-2 text-blue-500" />;
      case "video":
        return <Video className="h-4 w-4 mr-2 text-purple-500" />;
      default:
        return null;
    }
  };

  return (
    <Card className="animate-fade-in opacity-0" style={{ animationDelay: "600ms", animationFillMode: "forwards" }}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CircleUserRound className="h-5 w-5" />
          Agent Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-4">
          <Avatar>
            <AvatarImage src={agent.avatar} alt={agent.name} />
            <AvatarFallback>{agent.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-lg font-semibold">{agent.name}</h3>
            <Badge variant="secondary">{agent.status}</Badge>
          </div>
        </div>
        <div>
          <h4 className="text-sm font-medium text-muted-foreground">Recent Activity</h4>
          <ul className="mt-2 space-y-2">
            {agent.recentActivity.map((activity, index) => (
              <li key={index} className="flex items-center text-sm">
                {getActivityIcon(activity.type)}
                <span>{activity.description}</span>
                <span className="ml-auto text-xs text-muted-foreground">{activity.time}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default AgentStatusPanel;
