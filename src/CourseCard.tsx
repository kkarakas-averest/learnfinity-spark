
import React from 'react';
import { Link } from "react-router-dom";
import { Clock, BarChart2, Users } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface CourseCardProps {
  id: string;
  title: string;
  description: string;
  category: string;
  duration: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  enrolled: number;
  image: string;
  progress?: number;
}

const CourseCard = ({
  id = "unknown",
  title = "Untitled Course",
  description = "No description available",
  category = "Uncategorized",
  duration = "Unknown duration",
  level = "Beginner",
  enrolled = 0,
  image = "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=1600&auto=format&fit=crop",
  progress = 0,
}: CourseCardProps) => {
  const [isHovered, setIsHovered] = React.useState(false);

  const getLevelColor = (level: string) => {
    switch (level) {
      case "Beginner":
        return "bg-green-100 text-green-800";
      case "Intermediate":
        return "bg-blue-100 text-blue-800";
      case "Advanced":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card
      className={`overflow-hidden transition-all duration-300 h-full flex flex-col ${
        isHovered ? "shadow-lg" : "shadow"
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative aspect-video w-full">
        <img 
          src={image} 
          alt={title} 
          className="object-cover w-full h-full" 
          onError={(e) => {
            e.currentTarget.src = "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=1600&auto=format&fit=crop";
          }}
        />
        {progress !== undefined && progress > 0 && (
          <div className="absolute bottom-0 w-full bg-gray-800 bg-opacity-75 px-4 py-1 text-white">
            <div className="flex items-center justify-between text-xs">
              <span>Progress: {progress}%</span>
              <span className="font-medium">{progress < 100 ? "In Progress" : "Completed"}</span>
            </div>
            <div className="w-full bg-gray-600 h-1 mt-1 rounded-full overflow-hidden">
              <div 
                className="bg-primary h-full rounded-full" 
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
        <Badge 
          className={`absolute top-2 right-2 ${getLevelColor(level)}`}
        >
          {level}
        </Badge>
      </div>

      <CardContent className="flex-grow p-4">
        <h3 className="font-bold text-xl mb-2 line-clamp-1">{title}</h3>
        <p className="text-muted-foreground mb-4 text-sm line-clamp-2">{description}</p>
        <div className="flex flex-wrap gap-2 mb-3">
          <Badge variant="outline" className="text-xs">{category}</Badge>
        </div>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            <span>{duration}</span>
          </div>
          <div className="flex items-center">
            <Users className="h-3 w-3 mr-1" />
            <span>{enrolled.toLocaleString()} enrolled</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <Link 
          to={`/course/${id}`} 
          className="w-full"
        >
          <Button variant="default" className="w-full">
            {progress && progress > 0 ? "Continue Learning" : "Start Course"}
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};

export default CourseCard;
