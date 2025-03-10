import {
  Accordion,
  AccordionContent,
  AccordionTrigger,
} from "@/components/ui/accordion";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { BookOpen } from "lucide-react";

// Create AccordionItem component since it's not exported from accordion.tsx
const AccordionItem = AccordionPrimitive.Item;

interface Module {
  id: string;
  title: string;
  description: string;
  content: string;
  topics: string[];
  orderIndex: number;
}

interface ModuleListProps {
  modules: Module[];
}

export function ModuleList({ modules }: ModuleListProps) {
  // Sort modules by orderIndex
  const sortedModules = [...modules].sort((a, b) => a.orderIndex - b.orderIndex);

  if (modules.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No modules available for this course.</p>
      </div>
    );
  }

  return (
    <Accordion type="single" collapsible className="w-full">
      {sortedModules.map((module) => (
        <AccordionItem key={module.id} value={module.id}>
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center text-left">
              <BookOpen className="mr-2 h-4 w-4" />
              <div>
                <h3 className="font-medium">{module.title}</h3>
                <p className="text-sm text-muted-foreground">{module.description}</p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="pt-4 pb-2">
              <h4 className="font-medium mb-2">Topics</h4>
              <ul className="list-disc pl-5 space-y-1">
                {module.topics.map((topic, index) => (
                  <li key={index} className="text-sm">{topic}</li>
                ))}
              </ul>
            </div>
            <div className="prose prose-sm max-w-none mt-4">
              {/* Render Markdown content. Could use a markdown renderer here if needed */}
              <div dangerouslySetInnerHTML={{ __html: module.content }} />
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
} 