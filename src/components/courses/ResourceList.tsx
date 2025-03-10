import { FileText, ArrowUpRight, Video, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Resource {
  id: string;
  title: string;
  type: string;
  url: string;
  description: string;
}

interface ResourceListProps {
  resources: Resource[];
}

export function ResourceList({ resources }: ResourceListProps) {
  // Function to get the appropriate icon based on resource type
  const getResourceIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "video":
        return <Video className="h-5 w-5" />;
      case "article":
        return <FileText className="h-5 w-5" />;
      case "book":
        return <BookOpen className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  if (!resources || resources.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No resources available for this course.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {resources.map((resource) => (
        <div
          key={resource.id}
          className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-start space-x-4">
            <div className="mt-1 text-primary">
              {getResourceIcon(resource.type)}
            </div>
            <div>
              <h3 className="font-medium">{resource.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{resource.description}</p>
              <p className="text-xs text-muted-foreground mt-1">Type: {resource.type}</p>
            </div>
          </div>
          <a
            href={resource.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 md:mt-0 md:ml-4"
          >
            <Button variant="outline" size="sm">
              <ArrowUpRight className="mr-2 h-4 w-4" />
              Open Resource
            </Button>
          </a>
        </div>
      ))}
    </div>
  );
} 