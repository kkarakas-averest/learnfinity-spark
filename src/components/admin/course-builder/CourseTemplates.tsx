import React from '@/lib/react-helpers';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  BookOpen,
  ChevronDown,
  Pencil,
  X,
  Copy,
  Settings,
  Search,
  Filter
} from 'lucide-react';
import { 
  CourseTemplate, 
  DifficultyLevel,
  ContentType
} from '@/types/course.types';

// Mock API function - This would be replaced with a real API call
const fetchTemplates = async (): Promise<CourseTemplate[]> => {
  // Simulate API call
  return [
    {
      id: 'template-001',
      name: 'Basic Onboarding Course',
      description: 'Standard template for new employee onboarding materials',
      structure: {
        moduleCount: 4,
        moduleTitles: [
          'Company Overview',
          'Team Introduction',
          'Tools and Systems',
          'HR Policies'
        ],
        defaultSections: [
          {
            moduleIndex: 0,
            sectionTypes: [ContentType.VIDEO, ContentType.TEXT, ContentType.QUIZ]
          },
          {
            moduleIndex: 1,
            sectionTypes: [ContentType.VIDEO, ContentType.TEXT]
          },
          {
            moduleIndex: 2,
            sectionTypes: [ContentType.VIDEO, ContentType.INTERACTIVE, ContentType.QUIZ]
          },
          {
            moduleIndex: 3,
            sectionTypes: [ContentType.TEXT, ContentType.QUIZ]
          }
        ]
      },
      defaultDuration: 240, // 4 hours
      targetSkillLevel: DifficultyLevel.BEGINNER,
      targetAudience: ['new_employees', 'interns'],
      createdBy: 'admin',
      createdAt: new Date('2024-12-01'),
      updatedAt: new Date('2024-12-01')
    },
    {
      id: 'template-002',
      name: 'Technical Skills Workshop',
      description: 'Template for hands-on technical training modules',
      structure: {
        moduleCount: 5,
        moduleTitles: [
          'Fundamentals',
          'Basic Concepts',
          'Practical Applications',
          'Advanced Topics',
          'Final Project'
        ],
        defaultSections: [
          {
            moduleIndex: 0,
            sectionTypes: [ContentType.VIDEO, ContentType.TEXT, ContentType.QUIZ]
          },
          {
            moduleIndex: 1,
            sectionTypes: [ContentType.VIDEO, ContentType.INTERACTIVE, ContentType.EXERCISE]
          },
          {
            moduleIndex: 2,
            sectionTypes: [ContentType.VIDEO, ContentType.EXERCISE, ContentType.PROJECT]
          },
          {
            moduleIndex: 3,
            sectionTypes: [ContentType.VIDEO, ContentType.TEXT, ContentType.INTERACTIVE, ContentType.EXERCISE]
          },
          {
            moduleIndex: 4,
            sectionTypes: [ContentType.PROJECT, ContentType.DISCUSSION]
          }
        ]
      },
      defaultDuration: 600, // 10 hours
      targetSkillLevel: DifficultyLevel.INTERMEDIATE,
      targetAudience: ['developers', 'technical_staff'],
      createdBy: 'admin',
      createdAt: new Date('2024-12-05'),
      updatedAt: new Date('2024-12-15')
    },
    {
      id: 'template-003',
      name: 'Leadership Development',
      description: 'Comprehensive leadership training program template',
      structure: {
        moduleCount: 6,
        moduleTitles: [
          'Leadership Fundamentals',
          'Communication Skills',
          'Team Management',
          'Strategic Thinking',
          'Conflict Resolution',
          'Growth & Development'
        ],
        defaultSections: [
          {
            moduleIndex: 0,
            sectionTypes: [ContentType.VIDEO, ContentType.TEXT, ContentType.ASSESSMENT]
          },
          {
            moduleIndex: 1,
            sectionTypes: [ContentType.VIDEO, ContentType.INTERACTIVE, ContentType.EXERCISE]
          },
          {
            moduleIndex: 2,
            sectionTypes: [ContentType.VIDEO, ContentType.DISCUSSION, ContentType.DISCUSSION]
          },
          {
            moduleIndex: 3,
            sectionTypes: [ContentType.VIDEO, ContentType.INTERACTIVE, ContentType.PROJECT]
          },
          {
            moduleIndex: 4,
            sectionTypes: [ContentType.VIDEO, ContentType.DISCUSSION, ContentType.ASSESSMENT]
          },
          {
            moduleIndex: 5,
            sectionTypes: [ContentType.INTERACTIVE, ContentType.PROJECT, ContentType.ASSESSMENT]
          }
        ]
      },
      defaultDuration: 1200, // 20 hours
      targetSkillLevel: DifficultyLevel.ADVANCED,
      targetAudience: ['managers', 'team_leads', 'executives'],
      createdBy: 'admin',
      createdAt: new Date('2024-12-10'),
      updatedAt: new Date('2024-12-20')
    }
  ];
};

const CourseTemplates = () => {
  const [templates, setTemplates] = React.useState<CourseTemplate[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [selectedTemplate, setSelectedTemplate] = React.useState<CourseTemplate | null>(null);
  const [isNewTemplateDialogOpen, setIsNewTemplateDialogOpen] = React.useState(false);
  const [isEditTemplateDialogOpen, setIsEditTemplateDialogOpen] = React.useState(false);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);

  React.useEffect(() => {
    const loadTemplates = async () => {
      try {
        setIsLoading(true);
        const data = await fetchTemplates();
        setTemplates(data);
      } catch (error) {
        console.error('Error loading templates:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTemplates();
  }, []);

  const handleCreateTemplate = (templateData: Partial<CourseTemplate>) => {
    // This would be an API call in a real implementation
    const newTemplate: CourseTemplate = {
      id: `template-${Date.now()}`,
      name: templateData.name || 'New Template',
      description: templateData.description || '',
      structure: templateData.structure || {
        moduleCount: 1,
        moduleTitles: ['Module 1'],
        defaultSections: []
      },
      defaultDuration: templateData.defaultDuration || 60,
      targetSkillLevel: templateData.targetSkillLevel || DifficultyLevel.BEGINNER,
      targetAudience: templateData.targetAudience || [],
      createdBy: 'current_user', // Would come from auth context
      createdAt: new Date(),
      updatedAt: new Date()
    };

    setTemplates([...templates, newTemplate]);
    setIsNewTemplateDialogOpen(false);
  };

  const handleEditTemplate = (templateData: Partial<CourseTemplate>) => {
    if (!selectedTemplate) return;
    
    // This would be an API call in a real implementation
    const updatedTemplates = templates.map(template => 
      template.id === selectedTemplate.id 
        ? { 
            ...template, 
            ...templateData,
            updatedAt: new Date()
          } 
        : template
    );

    setTemplates(updatedTemplates);
    setIsEditTemplateDialogOpen(false);
  };

  const handleDeleteTemplate = () => {
    if (!selectedTemplate) return;
    
    // This would be an API call in a real implementation
    const updatedTemplates = templates.filter(template => 
      template.id !== selectedTemplate.id
    );

    setTemplates(updatedTemplates);
    setIsDeleteDialogOpen(false);
  };

  const handleDuplicateTemplate = (template: CourseTemplate) => {
    const duplicatedTemplate: CourseTemplate = {
      ...template,
      id: `template-${Date.now()}`,
      name: `${template.name} (Copy)`,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    setTemplates([...templates, duplicatedTemplate]);
  };

  // Component for new template form
  const NewTemplateForm = () => {
    const [name, setName] = React.useState('');
    const [description, setDescription] = React.useState('');
    const [moduleCount, setModuleCount] = React.useState(1);
    const [moduleTitles, setModuleTitles] = React.useState<string[]>(['Module 1']);
    const [duration, setDuration] = React.useState(60);
    const [skillLevel, setSkillLevel] = React.useState<DifficultyLevel>(DifficultyLevel.BEGINNER);
    const [targetAudience, setTargetAudience] = React.useState('');

    const updateModuleTitles = (count: number) => {
      const newTitles = [...moduleTitles];
      
      // Add new titles if count increased
      for (let i = moduleTitles.length; i < count; i++) {
        newTitles.push(`Module ${i + 1}`);
      }
      
      // Remove titles if count decreased
      if (count < moduleTitles.length) {
        newTitles.splice(count);
      }
      
      setModuleTitles(newTitles);
    };

    const handleModuleCountChange = (value: string) => {
      const count = parseInt(value);
      if (!isNaN(count) && count > 0) {
        setModuleCount(count);
        updateModuleTitles(count);
      }
    };

    const handleModuleTitleChange = (index: number, title: string) => {
      const newTitles = [...moduleTitles];
      newTitles[index] = title;
      setModuleTitles(newTitles);
    };

    const handleSubmit = () => {
      const templateData: Partial<CourseTemplate> = {
        name,
        description,
        structure: {
          moduleCount,
          moduleTitles,
          defaultSections: []
        },
        defaultDuration: duration,
        targetSkillLevel: skillLevel,
        targetAudience: targetAudience.split(',').map(item => item.trim()),
      };

      handleCreateTemplate(templateData);
    };

    return (
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="name" className="text-right">
            Name
          </Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="col-span-3"
            required
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="description" className="text-right">
            Description
          </Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="col-span-3"
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="moduleCount" className="text-right">
            Number of Modules
          </Label>
          <Input
            id="moduleCount"
            type="number"
            min="1"
            value={moduleCount}
            onChange={(e) => handleModuleCountChange(e.target.value)}
            className="col-span-3"
          />
        </div>
        <div className="grid grid-cols-4 items-start gap-4">
          <Label className="text-right pt-2">Module Titles</Label>
          <div className="col-span-3 space-y-2">
            {moduleTitles.map((title, index) => (
              <Input
                key={index}
                value={title}
                onChange={(e) => handleModuleTitleChange(index, e.target.value)}
                placeholder={`Module ${index + 1} Title`}
              />
            ))}
          </div>
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="duration" className="text-right">
            Duration (minutes)
          </Label>
          <Input
            id="duration"
            type="number"
            min="15"
            value={duration}
            onChange={(e) => setDuration(parseInt(e.target.value))}
            className="col-span-3"
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="skillLevel" className="text-right">
            Skill Level
          </Label>
          <Select 
            value={skillLevel}
            onValueChange={(value) => setSkillLevel(value as DifficultyLevel)}
          >
            <SelectTrigger className="col-span-3">
              <SelectValue placeholder="Select a skill level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={DifficultyLevel.BEGINNER}>Beginner</SelectItem>
              <SelectItem value={DifficultyLevel.INTERMEDIATE}>Intermediate</SelectItem>
              <SelectItem value={DifficultyLevel.ADVANCED}>Advanced</SelectItem>
              <SelectItem value={DifficultyLevel.EXPERT}>Expert</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="targetAudience" className="text-right">
            Target Audience
          </Label>
          <Input
            id="targetAudience"
            value={targetAudience}
            onChange={(e) => setTargetAudience(e.target.value)}
            placeholder="e.g. developers, managers (comma separated)"
            className="col-span-3"
          />
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSubmit}>Create Template</Button>
        </DialogFooter>
      </div>
    );
  };

  const EditTemplateForm = () => {
    if (!selectedTemplate) return null;

    const [name, setName] = React.useState(selectedTemplate.name);
    const [description, setDescription] = React.useState(selectedTemplate.description);
    const [moduleCount, setModuleCount] = React.useState(selectedTemplate.structure.moduleCount);
    const [moduleTitles, setModuleTitles] = React.useState<string[]>(selectedTemplate.structure.moduleTitles);
    const [duration, setDuration] = React.useState(selectedTemplate.defaultDuration);
    const [skillLevel, setSkillLevel] = React.useState<DifficultyLevel>(selectedTemplate.targetSkillLevel);
    const [targetAudience, setTargetAudience] = React.useState(selectedTemplate.targetAudience.join(', '));

    const updateModuleTitles = (count: number) => {
      const newTitles = [...moduleTitles];
      
      // Add new titles if count increased
      for (let i = moduleTitles.length; i < count; i++) {
        newTitles.push(`Module ${i + 1}`);
      }
      
      // Remove titles if count decreased
      if (count < moduleTitles.length) {
        newTitles.splice(count);
      }
      
      setModuleTitles(newTitles);
    };

    const handleModuleCountChange = (value: string) => {
      const count = parseInt(value);
      if (!isNaN(count) && count > 0) {
        setModuleCount(count);
        updateModuleTitles(count);
      }
    };

    const handleModuleTitleChange = (index: number, title: string) => {
      const newTitles = [...moduleTitles];
      newTitles[index] = title;
      setModuleTitles(newTitles);
    };

    const handleSubmit = () => {
      const templateData: Partial<CourseTemplate> = {
        name,
        description,
        structure: {
          moduleCount,
          moduleTitles,
          defaultSections: selectedTemplate.structure.defaultSections
        },
        defaultDuration: duration,
        targetSkillLevel: skillLevel,
        targetAudience: targetAudience.split(',').map(item => item.trim()),
      };

      handleEditTemplate(templateData);
    };

    return (
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="edit-name" className="text-right">
            Name
          </Label>
          <Input
            id="edit-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="col-span-3"
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="edit-description" className="text-right">
            Description
          </Label>
          <Textarea
            id="edit-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="col-span-3"
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="edit-moduleCount" className="text-right">
            Number of Modules
          </Label>
          <Input
            id="edit-moduleCount"
            type="number"
            min="1"
            value={moduleCount}
            onChange={(e) => handleModuleCountChange(e.target.value)}
            className="col-span-3"
          />
        </div>
        <div className="grid grid-cols-4 items-start gap-4">
          <Label className="text-right pt-2">Module Titles</Label>
          <div className="col-span-3 space-y-2">
            {moduleTitles.map((title, index) => (
              <Input
                key={index}
                value={title}
                onChange={(e) => handleModuleTitleChange(index, e.target.value)}
                placeholder={`Module ${index + 1} Title`}
              />
            ))}
          </div>
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="edit-duration" className="text-right">
            Duration (minutes)
          </Label>
          <Input
            id="edit-duration"
            type="number"
            min="15"
            value={duration}
            onChange={(e) => setDuration(parseInt(e.target.value))}
            className="col-span-3"
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="edit-skillLevel" className="text-right">
            Skill Level
          </Label>
          <Select 
            value={skillLevel}
            onValueChange={(value) => setSkillLevel(value as DifficultyLevel)}
          >
            <SelectTrigger className="col-span-3">
              <SelectValue placeholder="Select a skill level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={DifficultyLevel.BEGINNER}>Beginner</SelectItem>
              <SelectItem value={DifficultyLevel.INTERMEDIATE}>Intermediate</SelectItem>
              <SelectItem value={DifficultyLevel.ADVANCED}>Advanced</SelectItem>
              <SelectItem value={DifficultyLevel.EXPERT}>Expert</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="edit-targetAudience" className="text-right">
            Target Audience
          </Label>
          <Input
            id="edit-targetAudience"
            value={targetAudience}
            onChange={(e) => setTargetAudience(e.target.value)}
            placeholder="e.g. developers, managers (comma separated)"
            className="col-span-3"
          />
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSubmit}>Update Template</Button>
        </DialogFooter>
      </div>
    );
  };

  const TemplatePreview = () => {
    if (!selectedTemplate) return null;

    return (
      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-semibold">Template Structure</h4>
          <div className="mt-2 border rounded-md p-4 space-y-4">
            {selectedTemplate.structure.moduleTitles.map((title, index) => (
              <div key={index} className="border-b pb-2 last:border-b-0 last:pb-0">
                <div className="flex justify-between items-center">
                  <h5 className="font-medium">{title}</h5>
                  <Badge variant="outline">Module {index + 1}</Badge>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedTemplate.structure.defaultSections
                    .filter(section => section.moduleIndex === index)
                    .flatMap(section => section.sectionTypes)
                    .map((type, i) => (
                      <Badge key={i} variant="secondary">{type}</Badge>
                    ))
                  }
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-semibold">Duration</h4>
            <p>{selectedTemplate.defaultDuration} minutes</p>
          </div>
          <div>
            <h4 className="text-sm font-semibold">Skill Level</h4>
            <p>{selectedTemplate.targetSkillLevel}</p>
          </div>
          <div>
            <h4 className="text-sm font-semibold">Target Audience</h4>
            <div className="flex flex-wrap gap-1 mt-1">
              {selectedTemplate.targetAudience.map((audience, i) => (
                <Badge key={i} variant="outline">{audience}</Badge>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold">Created</h4>
            <p>{selectedTemplate.createdAt.toLocaleDateString()}</p>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => setIsPreviewDialogOpen(false)}>Close</Button>
        </DialogFooter>
      </div>
    );
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Course Templates</h1>
          <p className="text-muted-foreground">
            Create and manage reusable templates for course creation
          </p>
        </div>
        <Button 
          onClick={() => setIsNewTemplateDialogOpen(true)}
          className="gap-1"
        >
          <FileText className="h-4 w-4" />
          New Template
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <p>Loading templates...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <Card key={template.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl">{template.name}</CardTitle>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <ChevronDown className="h-4 w-4" />
                        <span className="sr-only">Actions</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem 
                        onClick={() => {
                          setSelectedTemplate(template);
                          setIsPreviewDialogOpen(true);
                        }}
                      >
                        <BookOpen className="h-4 w-4 mr-2" />
                        Preview
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => {
                          setSelectedTemplate(template);
                          setIsEditTemplateDialogOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDuplicateTemplate(template)}>
                        <Copy className="h-4 w-4 mr-2" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => {
                          setSelectedTemplate(template);
                          setIsDeleteDialogOpen(true);
                        }}
                        className="text-destructive focus:text-destructive"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <CardDescription className="line-clamp-2">
                  {template.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                  <div>
                    <p className="font-medium">Modules</p>
                    <p>{template.structure.moduleCount}</p>
                  </div>
                  <div>
                    <p className="font-medium">Duration</p>
                    <p>{template.defaultDuration} min</p>
                  </div>
                  <div>
                    <p className="font-medium">Level</p>
                    <p>{template.targetSkillLevel}</p>
                  </div>
                  <div>
                    <p className="font-medium">Last Updated</p>
                    <p>{template.updatedAt.toLocaleDateString()}</p>
                  </div>
                </div>
                <div>
                  <p className="font-medium text-sm mb-1">Target Audience</p>
                  <div className="flex flex-wrap gap-1">
                    {template.targetAudience.map((audience, i) => (
                      <Badge key={i} variant="outline">{audience}</Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between pt-3">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => {
                    setSelectedTemplate(template);
                    setIsPreviewDialogOpen(true);
                  }}
                >
                  Preview
                </Button>
                <Button 
                  size="sm"
                  onClick={() => {
                    // This would navigate to course creation with the template
                    console.log('Create course with template:', template.id);
                  }}
                >
                  Use Template
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* New Template Dialog */}
      <Dialog open={isNewTemplateDialogOpen} onOpenChange={setIsNewTemplateDialogOpen}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>Create New Template</DialogTitle>
            <DialogDescription>
              Define the structure and details of your course template.
            </DialogDescription>
          </DialogHeader>
          <NewTemplateForm />
        </DialogContent>
      </Dialog>

      {/* Edit Template Dialog */}
      <Dialog open={isEditTemplateDialogOpen} onOpenChange={setIsEditTemplateDialogOpen}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>Edit Template</DialogTitle>
            <DialogDescription>
              Update the structure and details of your course template.
            </DialogDescription>
          </DialogHeader>
          <EditTemplateForm />
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>
              {selectedTemplate?.name}
            </DialogTitle>
            <DialogDescription>
              {selectedTemplate?.description}
            </DialogDescription>
          </DialogHeader>
          <TemplatePreview />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the template "{selectedTemplate?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteTemplate}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CourseTemplates; 