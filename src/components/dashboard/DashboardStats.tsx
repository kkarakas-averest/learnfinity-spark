
import { Clock, FileBadge, Calendar, BarChart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Mock data
const mockStats = [
  {
    title: "Hours Learned",
    value: "24.5",
    icon: <Clock className="h-4 w-4" />,
    change: "+2.5 this week",
    trend: "up",
  },
  {
    title: "Courses Completed",
    value: "3",
    icon: <FileBadge className="h-4 w-4" />,
    change: "+1 this month",
    trend: "up",
  },
  {
    title: "Current Streak",
    value: "5 days",
    icon: <Calendar className="h-4 w-4" />,
    change: "Best: 12 days",
    trend: "neutral",
  },
  {
    title: "Skills Mastered",
    value: "8",
    icon: <BarChart className="h-4 w-4" />,
    change: "4 in progress",
    trend: "neutral",
  },
];

const DashboardStats = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {mockStats.map((stat, i) => (
        <Card key={i} className="animate-fade-in opacity-0" style={{ animationDelay: `${i * 100 + 400}ms`, animationFillMode: "forwards" }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
              {stat.icon}
              {stat.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className={`text-xs mt-1 ${
              stat.trend === "up" 
                ? "text-green-600" 
                : stat.trend === "down" 
                ? "text-red-600" 
                : "text-muted-foreground"
            }`}>
              {stat.change}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default DashboardStats;
