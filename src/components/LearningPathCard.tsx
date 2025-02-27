
import { ChevronRight } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";

interface LearningPathCardProps {
  id: string;
  title: string;
  description: string;
  courseCount: number;
  estimatedTime: string;
  progress: number;
  recommended: boolean;
  tags: string[];
}

const LearningPathCard = ({
  id,
  title,
  description,
  courseCount,
  estimatedTime,
  progress,
  recommended,
  tags,
}: LearningPathCardProps) => {
  return (
    <Card className="overflow-hidden transition-all duration-300 h-full hover:shadow-lg">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-semibold mb-1">{title}</h3>
            <div className="flex gap-2 mb-2 flex-wrap">
              {tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="font-normal">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
          {recommended && (
            <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
              AI Recommended
            </Badge>
          )}
        </div>
        
        <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
          {description}
        </p>
        
        <div className="flex items-center justify-between mb-2 text-sm">
          <span className="text-muted-foreground">{courseCount} courses</span>
          <span className="text-muted-foreground">{estimatedTime}</span>
        </div>
        
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </CardContent>
      
      <CardFooter className="px-6 pb-6 pt-0">
        <Button variant="outline" className="w-full group" asChild>
          <Link to={`/learning-paths/${id}`} className="flex items-center justify-center">
            View Path
            <ChevronRight size={16} className="ml-1 transition-transform group-hover:translate-x-1" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default LearningPathCard;
