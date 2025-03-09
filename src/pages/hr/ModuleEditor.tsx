import React from '@/lib/react-helpers';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Layers,
  FileText,
  Video,
  Save,
  ArrowLeft,
  BookOpen,
  X,
  Settings,
  BarChart2
} from 'lucide-react';

/**
 * ModuleEditor component for creating and editing learning modules
 * Used within the Course Builder system
 */
const ModuleEditor: React.FC = () => {
  const { moduleId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = React.useState('content');
  
  // Sample module data - in production, this would be fetched from an API
  const [module, setModule] = React.useState({
    id: moduleId || 'new',
    title: moduleId ? 'JavaScript Fundamentals' : '',
    description: moduleId ? 'Learn the basic concepts of JavaScript programming including variables, functions, and control flow.' : '',
    duration: moduleId ? 60 : 30, // minutes
    contentBlocks: moduleId ? [
      {
        id: '1',
        type: 'text',
        title: 'Introduction to JavaScript',
        content: 'JavaScript is a scripting language that enables interactive web pages. It is an interpreted language, just-in-time compiled, and multi-paradigm.',
        order: 1
      },
      {
        id: '2',
        type: 'video',
        title: 'Variables and Data Types',
        videoUrl: 'https://example.com/javascript-variables.mp4',
        duration: 8, // minutes
        order: 2
      },
      {
        id: '3',
        type: 'quiz',
        title: 'JavaScript Basics Quiz',
        questions: [
          { question: 'What keyword is used to declare a variable in JavaScript?', options: ['var', 'let', 'const', 'All of the above'] },
          { question: 'Which is not a JavaScript data type?', options: ['undefined', 'boolean', 'float', 'symbol'] }
        ],
        order: 3
      }
    ] : []
  });

  // Handle module title/description changes
  const handleModuleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setModule(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle duration change
  const handleDurationChange = (value: string) => {
    setModule(prev => ({
      ...prev,
      duration: parseInt(value, 10) || 0
    }));
  };

  // Add new content block
  const addContentBlock = (type: string) => {
    const newBlock = {
      id: `new-${Date.now()}`,
      type,
      title: `New ${type.charAt(0).toUpperCase() + type.slice(1)} Content`,
      content: '',
      order: module.contentBlocks.length + 1
    };
    
    setModule(prev => ({
      ...prev,
      contentBlocks: [...prev.contentBlocks, newBlock]
    }));
  };

  // Update content block
  const updateContentBlock = (id: string, field: string, value: string | number) => {
    setModule(prev => ({
      ...prev,
      contentBlocks: prev.contentBlocks.map(block => 
        block.id === id ? { ...block, [field]: value } : block
      )
    }));
  };

  // Delete content block
  const deleteContentBlock = (id: string) => {
    setModule(prev => ({
      ...prev,
      contentBlocks: prev.contentBlocks.filter(block => block.id !== id)
    }));
  };

  // Save module
  const saveModule = () => {
    // In a real app, this would save to a database
    console.log('Saving module:', module);
    // Example success behavior: navigate back to module list
    navigate('/hr-dashboard/course-builder');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <Button variant="ghost" onClick={() => navigate('/hr-dashboard/course-builder')} className="mr-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">
            {moduleId ? 'Edit Module' : 'Create New Module'}
          </h1>
        </div>
        <Button onClick={saveModule}>
          <Save className="h-4 w-4 mr-2" />
          Save Module
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Module Details Section */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Layers className="h-5 w-5 text-blue-500 mr-2" />
                Module Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Module Title</Label>
                <Input 
                  id="title" 
                  name="title"
                  value={module.title} 
                  onChange={handleModuleChange} 
                  placeholder="Enter module title" 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description" 
                  name="description"
                  value={module.description} 
                  onChange={handleModuleChange} 
                  placeholder="Enter module description" 
                  rows={4} 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="duration">Estimated Duration (minutes)</Label>
                <Select
                  value={module.duration.toString()}
                  onValueChange={handleDurationChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="90">1.5 hours</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
          
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <BookOpen className="h-5 w-5 text-green-500 mr-2" />
                Add Content
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" onClick={() => addContentBlock('text')} className="flex items-center justify-center py-6">
                  <FileText className="h-5 w-5 mr-2" />
                  Text
                </Button>
                <Button variant="outline" onClick={() => addContentBlock('video')} className="flex items-center justify-center py-6">
                  <Video className="h-5 w-5 mr-2" />
                  Video
                </Button>
                <Button variant="outline" onClick={() => addContentBlock('image')} className="flex items-center justify-center py-6">
                  <BarChart2 className="h-5 w-5 mr-2" />
                  Image
                </Button>
                <Button variant="outline" onClick={() => addContentBlock('quiz')} className="flex items-center justify-center py-6">
                  <FileText className="h-5 w-5 mr-2" />
                  Quiz
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Module Content Section */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="border-b">
              <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList>
                  <TabsTrigger value="content">Content</TabsTrigger>
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
            
            <CardContent className="pt-6">
              <TabsContent value="content" className="mt-0 space-y-6">
                {module.contentBlocks.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed rounded-lg">
                    <p className="text-gray-500 mb-4">No content blocks added yet</p>
                    <p className="text-sm text-gray-400">Use the "Add Content" panel to add your first content block</p>
                  </div>
                ) : (
                  module.contentBlocks.map((block, index) => (
                    <Card key={block.id} className="relative">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            {block.type === 'text' && <FileText className="h-4 w-4 mr-2 text-blue-500" />}
                            {block.type === 'video' && <Video className="h-4 w-4 mr-2 text-red-500" />}
                            {block.type === 'quiz' && <FileText className="h-4 w-4 mr-2 text-green-500" />}
                            {block.type === 'image' && <BarChart2 className="h-4 w-4 mr-2 text-purple-500" />}
                            <Input 
                              value={block.title || ''} 
                              onChange={(e) => updateContentBlock(block.id, 'title', e.target.value)}
                              className="font-medium border-none px-0 h-auto py-0 focus-visible:ring-0"
                              placeholder="Enter title"
                            />
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => deleteContentBlock(block.id)}
                            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {block.type === 'text' && (
                          <Textarea 
                            value={block.content || ''}
                            onChange={(e) => updateContentBlock(block.id, 'content', e.target.value)}
                            placeholder="Enter text content here"
                            rows={5}
                          />
                        )}
                        
                        {block.type === 'video' && (
                          <div className="space-y-3">
                            <div className="space-y-1">
                              <Label htmlFor={`video-url-${block.id}`}>Video URL</Label>
                              <Input 
                                id={`video-url-${block.id}`}
                                value={block.videoUrl || ''}
                                onChange={(e) => updateContentBlock(block.id, 'videoUrl', e.target.value)}
                                placeholder="Enter video URL (YouTube, Vimeo, etc.)"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <Label htmlFor={`video-duration-${block.id}`}>Duration (minutes)</Label>
                                <Input 
                                  id={`video-duration-${block.id}`}
                                  type="number"
                                  value={block.duration || ''}
                                  onChange={(e) => updateContentBlock(block.id, 'duration', parseInt(e.target.value, 10) || 0)}
                                  placeholder="Duration"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {block.type === 'quiz' && (
                          <div className="text-center py-6 border rounded-lg">
                            <p className="text-gray-500">Quiz editor would go here</p>
                            <p className="text-sm text-gray-400 mt-1">Allow creating multiple choice questions, true/false, etc.</p>
                          </div>
                        )}
                        
                        {block.type === 'image' && (
                          <div className="space-y-3">
                            <div className="space-y-1">
                              <Label htmlFor={`image-url-${block.id}`}>Image URL</Label>
                              <Input 
                                id={`image-url-${block.id}`}
                                value={block.imageUrl || ''}
                                onChange={(e) => updateContentBlock(block.id, 'imageUrl', e.target.value)}
                                placeholder="Enter image URL"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor={`image-alt-${block.id}`}>Alt Text</Label>
                              <Input 
                                id={`image-alt-${block.id}`}
                                value={block.altText || ''}
                                onChange={(e) => updateContentBlock(block.id, 'altText', e.target.value)}
                                placeholder="Enter alt text for accessibility"
                              />
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>
              
              <TabsContent value="preview" className="mt-0">
                <div className="border rounded-lg p-6">
                  <h2 className="text-2xl font-bold mb-4">{module.title || 'Untitled Module'}</h2>
                  <p className="text-gray-600 mb-6">{module.description || 'No description provided.'}</p>
                  
                  <div className="space-y-8">
                    {module.contentBlocks.map((block, index) => (
                      <div key={block.id} className="border-b pb-6 last:border-b-0">
                        <h3 className="text-xl font-medium mb-3">{block.title}</h3>
                        
                        {block.type === 'text' && (
                          <p className="whitespace-pre-line">{block.content || 'No content yet.'}</p>
                        )}
                        
                        {block.type === 'video' && (
                          <div className="aspect-video bg-gray-100 flex items-center justify-center rounded-lg">
                            <Video className="h-12 w-12 text-gray-400" />
                            <span className="ml-2 text-gray-500">Video player would go here</span>
                          </div>
                        )}
                        
                        {block.type === 'image' && (
                          <div className="aspect-video bg-gray-100 flex items-center justify-center rounded-lg">
                            <BarChart2 className="h-12 w-12 text-gray-400" />
                            <span className="ml-2 text-gray-500">Image would display here</span>
                          </div>
                        )}
                        
                        {block.type === 'quiz' && (
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <h4 className="font-medium mb-3">Quiz: {block.title}</h4>
                            <p className="text-gray-500">Quiz questions would display here</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="settings" className="mt-0">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="prerequisite">Prerequisites</Label>
                    <Select defaultValue="none">
                      <SelectTrigger>
                        <SelectValue placeholder="Select prerequisite" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="intro">Introduction to Programming</SelectItem>
                        <SelectItem value="html">HTML & CSS Basics</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="visibility">Visibility</Label>
                    <Select defaultValue="draft">
                      <SelectTrigger>
                        <SelectValue placeholder="Select visibility" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="private">Private</SelectItem>
                        <SelectItem value="public">Public</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="completion">Completion Criteria</Label>
                    <Select defaultValue="all">
                      <SelectTrigger>
                        <SelectValue placeholder="Select completion criteria" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Complete all content</SelectItem>
                        <SelectItem value="quiz">Pass quiz</SelectItem>
                        <SelectItem value="any">View any content</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ModuleEditor; 