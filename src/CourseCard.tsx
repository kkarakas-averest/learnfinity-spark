
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
  id,
  title,
  description,
  category,
  duration,
  level,
  enrolled,
  image,
  progress,
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
        isHovered ? "shadow-lg transform translate-y-[-4px]" : "shadow-md"
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative aspect-video overflow-hidden">
        <img
          src={image}
          alt={title}
          className={`object-cover w-full h-full transition-transform duration-700 ${
            isHovered ? "scale-105" : "scale-100"
          }`}
        />
        <Badge className="absolute top-3 left-3">{category}</Badge>
        {progress !== undefined && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-secondary">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>
      <CardContent className="flex-grow p-6">
        <h3 className="text-xl font-semibold mb-2 line-clamp-2">{title}</h3>
        <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
          {description}
        </p>
        <div className="flex flex-wrap gap-3 mb-2">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock size={14} />
            <span>{duration}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <BarChart2 size={14} />
            <span className={`px-2 py-0.5 rounded-full ${getLevelColor(level)}`}>
              {level}
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Users size={14} />
            <span>{enrolled.toLocaleString()} enrolled</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="px-6 pb-6 pt-0">
        <Button asChild className="w-full">
          <Link to={`/courses/${id}`}>
            {progress !== undefined && progress > 0
              ? "Continue Learning"
              : "Start Course"}
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default CourseCard;
