
import React from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';

interface Module {
  id: string;
  title: string;
  completed?: boolean;
}

interface CourseModuleListProps {
  modules: Module[];
  selectedModuleId: string | null;
  onSelectModule: (moduleId: string) => void;
}

const CourseModuleList: React.FC<CourseModuleListProps> = ({
  modules,
  selectedModuleId,
  onSelectModule,
}) => {
  return (
    <div className="space-y-2">
      {modules.map((module) => (
        <Button
          key={module.id}
          variant={selectedModuleId === module.id ? "default" : "outline"}
          className="w-full justify-start"
          onClick={() => onSelectModule(module.id)}
        >
          <div className="flex items-center w-full">
            {module.completed && <CheckCircle className="h-4 w-4 mr-2 text-green-500" />}
            <span className="truncate">{module.title}</span>
          </div>
        </Button>
      ))}
      
      {modules.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-2">No modules available</p>
      )}
    </div>
  );
};

export default CourseModuleList;
