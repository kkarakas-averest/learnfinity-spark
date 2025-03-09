import React from '@/lib/react-helpers';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  ArrowLeft, 
  FileText, 
  BookOpen, 
  BarChart2,
  Filter,
  X,
  Search
} from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

/**
 * CourseTemplates component for managing course templates
 * Used within the Course Builder system
 */
const CourseTemplates: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [filterCategory, setFilterCategory] = React.useState('all');
  const [showNewTemplateForm, setShowNewTemplateForm] = React.useState(false);
  
  // Sample template data - in production, this would be fetched from an API
  const templates = [
    {
      id: '1',
      title: 'Technical Skills Workshop',
      description: 'A template for technical skills training with hands-on exercises and assessments.',
      category: 'technical',
      modules: 4,
      estimatedDuration: 120, // minutes
      lastModified: '2023-11-10T14:30:00Z',
      author: 'Alex Johnson'
    },
    {
      id: '2',
      title: 'Leadership Fundamentals',
      description: 'Core leadership training covering communication, delegation, and team building.',
      category: 'leadership',
      modules: 6,
      estimatedDuration: 180, // minutes
      lastModified: '2023-10-22T09:15:00Z',
      author: 'Sarah Williams'
    },
    {
      id: '3',
      title: 'Compliance Training',
      description: 'Essential compliance topics including data privacy, security, and workplace policies.',
      category: 'compliance',
      modules: 5,
      estimatedDuration: 90, // minutes
      lastModified: '2023-11-05T11:45:00Z',
      author: 'Michael Chen'
    },
    {
      id: '4',
      title: 'New Employee Onboarding',
      description: 'Comprehensive onboarding program for new hires covering company culture, tools, and processes.',
      category: 'onboarding',
      modules: 8,
      estimatedDuration: 240, // minutes
      lastModified: '2023-10-15T16:20:00Z',
      author: 'Emily Rodriguez'
    }
  ];
  
  // Filter templates based on search query and category
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           template.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || template.category === filterCategory;
    
    return matchesSearch && matchesCategory;
  });
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Format duration for display
  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} minutes`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return remainingMinutes > 0 
        ? `${hours} hour${hours > 1 ? 's' : ''} ${remainingMinutes} min` 
        : `${hours} hour${hours > 1 ? 's' : ''}`;
    }
  };
  
  // Get badge color based on category
  const getCategoryBadgeColor = (category: string) => {
    switch (category) {
      case 'technical':
        return 'bg-blue-100 text-blue-800';
      case 'leadership':
        return 'bg-purple-100 text-purple-800';
      case 'compliance':
        return 'bg-red-100 text-red-800';
      case 'onboarding':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Navigate to create a new course using the selected template
  const createCourseFromTemplate = (templateId: string) => {
    // In a real app, this would navigate to a course creation page with the template pre-loaded
    console.log(`Creating course from template ID: ${templateId}`);
    navigate(`/hr-dashboard/course-builder/templates/${templateId}/use`);
  };
  
  // Navigate to edit the template
  const editTemplate = (templateId: string) => {
    // In a real app, this would navigate to a template editor
    console.log(`Editing template ID: ${templateId}`);
    navigate(`/hr-dashboard/course-builder/templates/${templateId}/edit`);
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <Button variant="ghost" onClick={() => navigate('/hr-dashboard/course-builder')} className="mr-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Course Templates</h1>
        </div>
        <Button onClick={() => setShowNewTemplateForm(!showNewTemplateForm)}>
          {showNewTemplateForm ? (
            <>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </>
          ) : (
            <>
              <FileText className="h-4 w-4 mr-2" />
              New Template
            </>
          )}
        </Button>
      </div>
      
      {showNewTemplateForm && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Create New Template</CardTitle>
            <CardDescription>Define the structure for a new course template</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="template-title">Template Title</Label>
                <Input id="template-title" placeholder="Enter template title" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="template-category">Category</Label>
                <Select defaultValue="technical">
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technical">Technical Skills</SelectItem>
                    <SelectItem value="leadership">Leadership</SelectItem>
                    <SelectItem value="compliance">Compliance</SelectItem>
                    <SelectItem value="onboarding">Onboarding</SelectItem>
                    <SelectItem value="soft-skills">Soft Skills</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="template-description">Description</Label>
                <Textarea 
                  id="template-description" 
                  placeholder="Enter template description" 
                  rows={3} 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="estimated-duration">Estimated Duration (minutes)</Label>
                <Input 
                  id="estimated-duration" 
                  type="number" 
                  defaultValue="60" 
                  min="15" 
                  step="15" 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="modules-count">Initial Modules</Label>
                <Input 
                  id="modules-count" 
                  type="number" 
                  defaultValue="3" 
                  min="1" 
                  max="10" 
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowNewTemplateForm(false)}>Cancel</Button>
            <Button>Create Template</Button>
          </CardFooter>
        </Card>
      )}
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search templates..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <Select
            value={filterCategory}
            onValueChange={setFilterCategory}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="technical">Technical Skills</SelectItem>
              <SelectItem value="leadership">Leadership</SelectItem>
              <SelectItem value="compliance">Compliance</SelectItem>
              <SelectItem value="onboarding">Onboarding</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {filteredTemplates.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <p className="text-gray-500 mb-2">No templates found</p>
          <p className="text-sm text-gray-400">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map(template => (
            <Card key={template.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{template.title}</CardTitle>
                    <div className="mt-1">
                      <Badge className={`${getCategoryBadgeColor(template.category)}`}>
                        {template.category.charAt(0).toUpperCase() + template.category.slice(1)}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex flex-col text-xs text-right text-gray-500">
                    <span>{formatDate(template.lastModified)}</span>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <p className="text-sm text-gray-600 line-clamp-3 mb-4">{template.description}</p>
                
                <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                  <div className="flex items-center">
                    <FileText className="h-3.5 w-3.5 text-gray-500 mr-1.5" />
                    <span>{template.modules} modules</span>
                  </div>
                  <div className="flex items-center">
                    <BookOpen className="h-3.5 w-3.5 text-gray-500 mr-1.5" />
                    <span>{formatDuration(template.estimatedDuration)}</span>
                  </div>
                </div>
                
                <Separator className="my-3" />
                
                <div className="text-xs text-gray-500">
                  Created by: {template.author}
                </div>
              </CardContent>
              
              <CardFooter className="flex justify-between pt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => editTemplate(template.id)}
                >
                  Edit Template
                </Button>
                <Button
                  size="sm"
                  onClick={() => createCourseFromTemplate(template.id)}
                >
                  Use Template
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default CourseTemplates; 