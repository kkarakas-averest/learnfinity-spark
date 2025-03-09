import React from '@/lib/react-helpers';
// Commented out until we can install react-beautiful-dnd
// import { 
//   DragDropContext, 
//   Droppable, 
//   Draggable, 
//   DropResult 
// } from 'react-beautiful-dnd';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Accordion,
  AccordionContent,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Video, 
  MessageSquare,
  BarChart2,
  X,
  Edit, 
  Pencil,
  Save,
  ArrowLeft,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { 
  Module, 
  Section, 
  ContentType, 
  DifficultyLevel 
} from '@/types/course.types';

// Add mocked DropResult type until react-beautiful-dnd is available
interface DropResult {
  draggableId: string;
  type: string;
  source: {
    index: number;
    droppableId: string;
  };
  destination?: {
    droppableId: string;
    index: number;
  };
  reason: 'DROP';
}

// Helper function to get icon for content type
const getContentTypeIcon = (type: ContentType) => {
  switch (type) {
    case ContentType.VIDEO:
      return <Video className="h-4 w-4" />;
    case ContentType.TEXT:
      return <FileText className="h-4 w-4" />;
    case ContentType.QUIZ:
    case ContentType.ASSESSMENT:
      return <BarChart2 className="h-4 w-4" />;
    case ContentType.INTERACTIVE:
      return <X className="h-4 w-4" />;
    case ContentType.EXERCISE:
    case ContentType.PROJECT:
      return <BarChart2 className="h-4 w-4" />;
    case ContentType.DISCUSSION:
      return <MessageSquare className="h-4 w-4" />;
    // Handle FILE_UPLOAD case differently since it might not exist
    // case ContentType.FILE_UPLOAD:
    //   return <FileText className="h-4 w-4" />;
    default:
      return <FileText className="h-4 w-4" />;
  }
};

// Mock module data
const mockModule: Module = {
  id: 'module-001',
  courseId: 'course-001',
  title: 'Introduction to JavaScript',
  description: 'Learn the fundamentals of JavaScript programming language',
  order: 1,
  sections: [
    {
      id: 'section-001',
      moduleId: 'module-001',
      title: 'What is JavaScript?',
      description: 'An overview of JavaScript and its role in web development',
      contentType: ContentType.VIDEO,
      content: 'https://example.com/videos/intro-to-js.mp4',
      order: 1,
      isOptional: false,
      estimatedDuration: 10, // minutes
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-01')
    },
    {
      id: 'section-002',
      moduleId: 'module-001',
      title: 'JavaScript Syntax Basics',
      description: 'Understanding JavaScript syntax, variables, and data types',
      contentType: ContentType.TEXT,
      content: '# JavaScript Basics\n\nJavaScript is a versatile programming language...',
      order: 2,
      isOptional: false,
      estimatedDuration: 15, // minutes
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-01')
    },
    {
      id: 'section-003',
      moduleId: 'module-001',
      title: 'Interactive Examples',
      description: 'Try out JavaScript with interactive code samples',
      contentType: ContentType.INTERACTIVE,
      content: JSON.stringify({
        initialCode: 'console.log("Hello, world!");',
        tasks: [
          'Create a variable and assign it a value',
          'Write a function that adds two numbers',
          'Use a conditional statement'
        ]
      }),
      order: 3,
      isOptional: false,
      estimatedDuration: 20, // minutes
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-01')
    },
    {
      id: 'section-004',
      moduleId: 'module-001',
      title: 'JavaScript Basics Quiz',
      description: 'Test your knowledge of JavaScript fundamentals',
      contentType: ContentType.QUIZ,
      content: JSON.stringify({
        questions: [
          {
            question: 'Which keyword is used to declare a constant in JavaScript?',
            options: ['var', 'let', 'const', 'def'],
            correctAnswer: 2
          },
          {
            question: 'What is the result of 5 + "5" in JavaScript?',
            options: ['10', '"55"', 'Error', 'undefined'],
            correctAnswer: 1
          }
        ]
      }),
      order: 4,
      isOptional: false,
      estimatedDuration: 10, // minutes
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-01')
    }
  ],
  isLocked: false,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01')
};

interface ModuleEditorProps {
  moduleId?: string;
  courseId?: string;
  onSave?: (module: Module) => void;
  onCancel?: () => void;
}

const ModuleEditor: React.FC<ModuleEditorProps> = ({ 
  moduleId, 
  courseId,
  onSave,
  onCancel
}) => {
  const [module, setModule] = React.useState<Module | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState('content');
  const [newSectionDialogOpen, setNewSectionDialogOpen] = React.useState(false);
  const [editSectionDialogOpen, setEditSectionDialogOpen] = React.useState(false);
  const [selectedSection, setSelectedSection] = React.useState<Section | null>(null);
  const [isDirty, setIsDirty] = React.useState(false);

  React.useEffect(() => {
    const loadModule = async () => {
      try {
        setIsLoading(true);
        // In a real implementation, this would fetch from an API
        if (moduleId) {
          // Fetch existing module
          setModule(mockModule);
        } else if (courseId) {
          // Create new module skeleton for the course
          setModule({
            id: `module-${Date.now()}`,
            courseId,
            title: 'New Module',
            description: '',
            order: 1, // This would be determined by the course service
            sections: [],
            isLocked: false,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
      } catch (error) {
        console.error('Error loading module:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadModule();
  }, [moduleId, courseId]);

  const handleDragEnd = (result: DropResult) => {
    if (!module) return;
    
    const { destination, source } = result;
    
    // If dropped outside a droppable area or at the same position
    if (!destination || 
        (destination.droppableId === source.droppableId && 
         destination.index === source.index)) {
      return;
    }
    
    // Reorder sections
    const sections = [...module.sections];
    const [removed] = sections.splice(source.index, 1);
    sections.splice(destination.index, 0, removed);
    
    // Update order property
    const updatedSections = sections.map((section, index) => ({
      ...section,
      order: index + 1
    }));
    
    setModule({
      ...module,
      sections: updatedSections,
      updatedAt: new Date()
    });
    
    setIsDirty(true);
  };

  const handleModuleInfoChange = (
    field: 'title' | 'description', 
    value: string
  ) => {
    if (!module) return;
    
    setModule({
      ...module,
      [field]: value,
      updatedAt: new Date()
    });
    
    setIsDirty(true);
  };

  const handleAddSection = (sectionData: Partial<Section>) => {
    if (!module) return;
    
    const newSection: Section = {
      id: `section-${Date.now()}`,
      moduleId: module.id,
      title: sectionData.title || 'New Section',
      description: sectionData.description || '',
      contentType: sectionData.contentType || ContentType.TEXT,
      content: sectionData.content || '',
      order: module.sections.length + 1,
      isOptional: sectionData.isOptional || false,
      estimatedDuration: sectionData.estimatedDuration || 10,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    setModule({
      ...module,
      sections: [...module.sections, newSection],
      updatedAt: new Date()
    });
    
    setNewSectionDialogOpen(false);
    setIsDirty(true);
  };

  const handleUpdateSection = (sectionData: Partial<Section>) => {
    if (!module || !selectedSection) return;
    
    const updatedSections = module.sections.map(section => 
      section.id === selectedSection.id 
        ? { 
            ...section, 
            ...sectionData,
            updatedAt: new Date()
          } 
        : section
    );
    
    setModule({
      ...module,
      sections: updatedSections,
      updatedAt: new Date()
    });
    
    setEditSectionDialogOpen(false);
    setIsDirty(true);
  };

  const handleDeleteSection = (sectionId: string) => {
    if (!module) return;
    
    const updatedSections = module.sections
      .filter(section => section.id !== sectionId)
      .map((section, index) => ({
        ...section,
        order: index + 1
      }));
    
    setModule({
      ...module,
      sections: updatedSections,
      updatedAt: new Date()
    });
    
    setIsDirty(true);
  };

  const handleSaveModule = () => {
    if (!module) return;
    
    // In a real implementation, this would call an API
    console.log('Saving module:', module);
    
    // Call onSave callback if provided
    if (onSave) {
      onSave(module);
    }
    
    setIsDirty(false);
  };

  const getDefaultContentForType = (contentType: ContentType): string => {
    switch (contentType) {
      case ContentType.TEXT:
        return '# New Content\n\nStart writing here...';
      case ContentType.VIDEO:
        return 'https://example.com/videos/placeholder.mp4';
      case ContentType.QUIZ:
        return JSON.stringify({
          questions: [
            {
              question: 'Sample question?',
              options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
              correctAnswer: 0
            }
          ]
        });
      case ContentType.INTERACTIVE:
        return JSON.stringify({
          initialCode: '// Write your code here',
          tasks: ['Complete the task']
        });
      default:
        return '';
    }
  };
  
  // New Section Form Component
  const SectionForm = ({ 
    section = null, 
    onSubmit 
  }: { 
    section?: Section | null, 
    onSubmit: (data: Partial<Section>) => void 
  }) => {
    const isEditing = !!section;
    const [title, setTitle] = React.useState(section?.title || '');
    const [description, setDescription] = React.useState(section?.description || '');
    const [contentType, setContentType] = React.useState<ContentType>(
      section?.contentType || ContentType.TEXT
    );
    const [content, setContent] = React.useState(section?.content || '');
    const [isOptional, setIsOptional] = React.useState(section?.isOptional || false);
    const [duration, setDuration] = React.useState(section?.estimatedDuration || 10);

    React.useEffect(() => {
      // Set default content based on type if creating new section or changing type
      if ((!isEditing || !section?.content) && !content) {
        setContent(getDefaultContentForType(contentType));
      }
    }, [contentType, isEditing, content, section]);

    const handleSubmit = () => {
      onSubmit({
        title,
        description,
        contentType,
        content,
        isOptional,
        estimatedDuration: duration
      });
    };

    return (
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="section-title" className="text-right">
            Title
          </Label>
          <Input
            id="section-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="col-span-3"
            required
          />
        </div>
        
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="section-description" className="text-right">
            Description
          </Label>
          <Textarea
            id="section-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="col-span-3"
          />
        </div>
        
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="content-type" className="text-right">
            Content Type
          </Label>
          <Select 
            value={contentType}
            onValueChange={(value) => setContentType(value as ContentType)}
          >
            <SelectTrigger className="col-span-3">
              <SelectValue placeholder="Select content type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ContentType.TEXT}>Text</SelectItem>
              <SelectItem value={ContentType.VIDEO}>Video</SelectItem>
              <SelectItem value={ContentType.QUIZ}>Quiz</SelectItem>
              <SelectItem value={ContentType.INTERACTIVE}>Interactive</SelectItem>
              <SelectItem value={ContentType.ASSESSMENT}>Assessment</SelectItem>
              <SelectItem value={ContentType.DISCUSSION}>Discussion</SelectItem>
              <SelectItem value={ContentType.EXERCISE}>Exercise</SelectItem>
              <SelectItem value={ContentType.PROJECT}>Project</SelectItem>
              <SelectItem value="FILE_UPLOAD">File Upload</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="grid grid-cols-4 items-start gap-4">
          <Label htmlFor="content" className="text-right pt-2">
            Content
          </Label>
          <Textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="col-span-3 min-h-[200px] font-mono text-sm"
            placeholder={`Enter ${contentType.toLowerCase()} content...`}
          />
        </div>
        
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="duration" className="text-right">
            Duration (minutes)
          </Label>
          <Input
            id="duration"
            type="number"
            min="1"
            value={duration}
            onChange={(e) => setDuration(parseInt(e.target.value) || 10)}
            className="col-span-3"
          />
        </div>
        
        <div className="grid grid-cols-4 items-center gap-4">
          <div className="text-right">Optional</div>
          <div className="col-span-3 flex items-center space-x-2">
            <input
              type="checkbox"
              id="optional"
              checked={isOptional}
              onChange={(e) => setIsOptional(e.target.checked)}
              className="form-checkbox h-4 w-4"
            />
            <Label htmlFor="optional" className="cursor-pointer">
              Mark as optional content
            </Label>
          </div>
        </div>
        
        <DialogFooter>
          <Button type="submit" onClick={handleSubmit}>
            {isEditing ? 'Update Section' : 'Add Section'}
          </Button>
        </DialogFooter>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p>Loading module...</p>
      </div>
    );
  }

  if (!module) {
    return (
      <div className="flex items-center justify-center h-64">
        <p>Module not found.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {moduleId ? 'Edit Module' : 'Create Module'}
          </h1>
          <p className="text-muted-foreground">
            {moduleId ? 'Modify an existing module' : 'Design a new learning module'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button 
            disabled={!isDirty} 
            onClick={handleSaveModule}
          >
            Save Module
          </Button>
        </div>
      </div>

      <Tabs 
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="w-full border-b pb-px justify-start rounded-none">
          <TabsTrigger value="content" className="rounded-b-none">
            Content
          </TabsTrigger>
          <TabsTrigger value="settings" className="rounded-b-none">
            Settings
          </TabsTrigger>
          <TabsTrigger value="preview" className="rounded-b-none">
            Preview
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="content" className="space-y-6">
          {/* Module Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Module Information</CardTitle>
              <CardDescription>
                Set the title and description for this module
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="module-title" className="text-right">
                  Title
                </Label>
                <Input
                  id="module-title"
                  value={module.title}
                  onChange={(e) => handleModuleInfoChange('title', e.target.value)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="module-description" className="text-right">
                  Description
                </Label>
                <Textarea
                  id="module-description"
                  value={module.description}
                  onChange={(e) => handleModuleInfoChange('description', e.target.value)}
                  className="col-span-3"
                />
              </div>
            </CardContent>
          </Card>
          
          {/* Module Sections */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Content Sections</CardTitle>
                  <CardDescription>
                    Organize the content sections for this module
                  </CardDescription>
                </div>
                <Button 
                  onClick={() => setNewSectionDialogOpen(true)}
                  className="gap-1"
                >
                  <Pencil className="h-4 w-4" />
                  Add Section
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Drag and Drop Context */}
            </CardContent>
            {module.sections.length > 0 && (
              <CardFooter className="justify-between border-t px-6 py-4">
                <div className="text-sm text-muted-foreground">
                  Total sections: {module.sections.length}
                </div>
                <div className="text-sm text-muted-foreground">
                  Total duration: {module.sections.reduce((total, section) => total + section.estimatedDuration, 0)} minutes
                </div>
              </CardFooter>
            )}
          </Card>
        </TabsContent>
        
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Module Settings</CardTitle>
              <CardDescription>
                Configure additional settings for this module
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="module-locked"
                  checked={module.isLocked}
                  onChange={(e) => {
                    setModule({
                      ...module,
                      isLocked: e.target.checked,
                      updatedAt: new Date()
                    });
                    setIsDirty(true);
                  }}
                  className="form-checkbox h-4 w-4"
                />
                <Label htmlFor="module-locked">
                  Lock module (require completion of prerequisites)
                </Label>
              </div>
              
              {/* Add more settings as needed */}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="preview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Module Preview</CardTitle>
              <CardDescription>
                Preview how the module will appear to learners
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="border-b pb-4">
                <h2 className="text-2xl font-bold">{module.title}</h2>
                <p className="text-muted-foreground mt-2">{module.description}</p>
              </div>
              
              <Accordion type="single" collapsible className="w-full">
                {module.sections.map((section) => (
                  <div key={section.id} className="border-b last:border-b-0">
                    <AccordionTrigger value={section.id}>
                      <div className="flex items-center gap-2">
                        {getContentTypeIcon(section.contentType)}
                        <span>{section.title}</span>
                        {section.isOptional && (
                          <Badge variant="outline" className="ml-2 text-xs py-0 px-2">
                            Optional
                          </Badge>
                        )}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent value={section.id}>
                      <div className="space-y-2">
                        <p className="text-muted-foreground">{section.description}</p>
                        <div className="flex items-center gap-2 text-sm">
                          <Badge variant="secondary">{section.contentType}</Badge>
                          <span>{section.estimatedDuration} min</span>
                        </div>
                        
                        {section.contentType === ContentType.TEXT && (
                          <div className="border rounded-md p-4 bg-muted/50 mt-2">
                            <p className="text-sm font-mono whitespace-pre-line">
                              {section.content}
                            </p>
                          </div>
                        )}
                        
                        {section.contentType === ContentType.VIDEO && (
                          <div className="border rounded-md p-4 bg-muted/50 mt-2">
                            <p className="text-sm">Video URL: {section.content}</p>
                          </div>
                        )}
                        
                        {/* Other content types would have appropriate previews */}
                      </div>
                    </AccordionContent>
                  </div>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* New Section Dialog */}
      <Dialog open={newSectionDialogOpen} onOpenChange={setNewSectionDialogOpen}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>Add New Section</DialogTitle>
            <DialogDescription>
              Create a new content section for your module
            </DialogDescription>
          </DialogHeader>
          <SectionForm onSubmit={handleAddSection} />
        </DialogContent>
      </Dialog>

      {/* Edit Section Dialog */}
      <Dialog open={editSectionDialogOpen} onOpenChange={setEditSectionDialogOpen}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>Edit Section</DialogTitle>
            <DialogDescription>
              Modify this content section
            </DialogDescription>
          </DialogHeader>
          <SectionForm section={selectedSection} onSubmit={handleUpdateSection} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ModuleEditor; 