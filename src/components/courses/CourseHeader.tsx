import { Button } from "@/components/ui/button";
import { BookOpen, Filter } from "lucide-react";
import Link from "next/link";

interface CourseHeaderProps {
  title: string;
  description: string;
  showCreateButton?: boolean;
}

export function CourseHeader({
  title,
  description,
  showCreateButton = true,
}: CourseHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <p className="text-muted-foreground mt-2">{description}</p>
      </div>
      <div className="flex items-center gap-4 mt-4 md:mt-0">
        <Button variant="outline" size="sm">
          <Filter className="mr-2 h-4 w-4" />
          Filter
        </Button>
        {showCreateButton && (
          <Link href="/hr/agent-management" passHref>
            <Button size="sm">
              <BookOpen className="mr-2 h-4 w-4" />
              Create Course
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
} 