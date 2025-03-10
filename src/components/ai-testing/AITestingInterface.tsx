"use client";

import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
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
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Loader2, Save, RefreshCw, FileText, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AgentService, CourseGenerationRequest, GeneratedCourse } from "@/services/agent-service";
import { JSONView } from "./JSONView";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { LoadingSkeleton } from "./LoadingSkeleton";

// Default course generation request for initial state
const defaultCourseRequest: CourseGenerationRequest = {
  title: "",
  description: "",
  targetAudience: "intermediate",
  duration: "medium",
  learningObjectives: [""],
  includeQuizzes: true,
  includeAssignments: true,
  includeResources: true,
  moduleCount: 3,
  generationMode: "complete",
  personalization: {
    adaptToLearningStyle: true,
    difficultyLevel: "medium",
    paceAdjustment: "moderate",
    interestAreas: [],
    priorKnowledge: {}
  }
};

export default function AITestingInterface() {
  // State management
  const [activeTab, setActiveTab] = React.useState<string>("configuration");
  const [courseRequest, setCourseRequest] = React.useState<CourseGenerationRequest>(defaultCourseRequest);
  const [learningObjectives, setLearningObjectives] = React.useState<string[]>([""]);
  const [interestAreas, setInterestAreas] = React.useState<string[]>([""]);
  const [isGenerating, setIsGenerating] = React.useState<boolean>(false);
  const [generatedCourse, setGeneratedCourse] = React.useState<GeneratedCourse | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [saveStatus, setSaveStatus] = React.useState<"idle" | "saving" | "saved" | "error">("idle");

  // Handle form changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { name: string; value: string } }
  ) => {
    const { name, value } = e.target;
    setCourseRequest(prev => ({ ...prev, [name]: value }));
  };

  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setCourseRequest(prev => ({ ...prev, [name]: value }));
  };

  // Handle checkbox changes
  const handleCheckboxChange = (name: string, checked: boolean) => {
    setCourseRequest(prev => ({ ...prev, [name]: checked }));
  };

  // Handle personalization changes
  const handlePersonalizationChange = (name: string, value: any) => {
    setCourseRequest(prev => ({
      ...prev,
      personalization: {
        ...prev.personalization,
        [name]: value
      }
    }));
  };

  // Handle learning objectives changes
  const handleObjectiveChange = (index: number, value: string) => {
    const newObjectives = [...learningObjectives];
    newObjectives[index] = value;
    setLearningObjectives(newObjectives);
    
    // Update course request with filtered non-empty objectives
    setCourseRequest(prev => ({
      ...prev,
      learningObjectives: newObjectives.filter(obj => obj.trim() !== "")
    }));
  };

  // Add new learning objective field
  const addObjective = () => {
    setLearningObjectives([...learningObjectives, ""]);
  };

  // Remove learning objective field
  const removeObjective = (index: number) => {
    if (learningObjectives.length > 1) {
      const newObjectives = learningObjectives.filter((_, i) => i !== index);
      setLearningObjectives(newObjectives);
      
      // Update course request with filtered non-empty objectives
      setCourseRequest(prev => ({
        ...prev,
        learningObjectives: newObjectives.filter(obj => obj.trim() !== "")
      }));
    }
  };

  // Handle interest areas changes
  const handleInterestChange = (index: number, value: string) => {
    const newInterests = [...interestAreas];
    newInterests[index] = value;
    setInterestAreas(newInterests);
    
    // Update course request with filtered non-empty interests
    setCourseRequest(prev => ({
      ...prev,
      personalization: {
        ...prev.personalization!,
        interestAreas: newInterests.filter(int => int.trim() !== "")
      }
    }));
  };

  // Add new interest area field
  const addInterest = () => {
    setInterestAreas([...interestAreas, ""]);
  };

  // Remove interest area field
  const removeInterest = (index: number) => {
    if (interestAreas.length > 1) {
      const newInterests = interestAreas.filter((_, i) => i !== index);
      setInterestAreas(newInterests);
      
      // Update course request with filtered non-empty interests
      setCourseRequest(prev => ({
        ...prev,
        personalization: {
          ...prev.personalization!,
          interestAreas: newInterests.filter(int => int.trim() !== "")
        }
      }));
    }
  };

  // Reset form to default values
  const handleReset = () => {
    setCourseRequest(defaultCourseRequest);
    setLearningObjectives([""]);
    setInterestAreas([""]);
    setGeneratedCourse(null);
    setError(null);
    setSaveStatus("idle");
    setActiveTab("configuration");
  };

  // Generate course content
  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      setError(null);
      setActiveTab("results");
      
      // Get AgentService instance
      const agentService = AgentService.getInstance();
      
      // Initialize agents if needed
      await agentService.initialize();
      
      // Clean up request
      const cleanRequest = {
        ...courseRequest,
        learningObjectives: courseRequest.learningObjectives.filter(obj => obj.trim() !== ""),
        personalization: {
          ...courseRequest.personalization!,
          interestAreas: courseRequest.personalization?.interestAreas.filter(int => int.trim() !== "") || []
        }
      };
      
      // Generate course
      const result = await agentService.generateCourse(cleanRequest);
      
      // Update state with result
      setGeneratedCourse(result);
    } catch (err) {
      console.error("Error generating course:", err);
      setError(err instanceof Error ? err.message : "Failed to generate course content");
    } finally {
      setIsGenerating(false);
    }
  };

  // Save generated course
  const handleSaveCourse = async () => {
    if (!generatedCourse) return;
    
    try {
      setSaveStatus("saving");
      
      const response = await fetch("/api/agents/course/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          course: generatedCourse
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Failed to save course");
      }
      
      setSaveStatus("saved");
      
      // Redirect to the new course page after a delay
      if (data.redirectUrl) {
        setTimeout(() => {
          window.location.href = data.redirectUrl;
        }, 1500);
      }
    } catch (err) {
      console.error("Error saving course:", err);
      setSaveStatus("error");
      setError(err instanceof Error ? err.message : "Failed to save course");
    }
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="configuration">
            <FileText className="h-4 w-4 mr-2" />
            Configuration
          </TabsTrigger>
          <TabsTrigger value="results">
            <BookOpen className="h-4 w-4 mr-2" />
            Results
          </TabsTrigger>
        </TabsList>

        {/* Configuration Tab */}
        <TabsContent value="configuration" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Course Information</CardTitle>
              <CardDescription>
                Enter the core details about the course you want to generate
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Course Title</Label>
                <Input
                  id="title"
                  name="title"
                  value={courseRequest.title}
                  onChange={handleChange}
                  placeholder="e.g. Introduction to Machine Learning"
                />
              </div>
              
              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Course Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={courseRequest.description}
                  onChange={handleChange}
                  placeholder="Briefly describe what this course will teach"
                  rows={3}
                />
              </div>
              
              {/* Target Audience & Duration */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="targetAudience">Target Audience</Label>
                  <Select 
                    value={courseRequest.targetAudience} 
                    onValueChange={(value) => handleSelectChange("targetAudience", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select audience skill level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="duration">Course Duration</Label>
                  <Select 
                    value={courseRequest.duration} 
                    onValueChange={(value) => handleSelectChange("duration", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select course length" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="short">Short (1-2 hours)</SelectItem>
                      <SelectItem value="medium">Medium (3-5 hours)</SelectItem>
                      <SelectItem value="long">Long (6+ hours)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Learning Objectives */}
              <div className="space-y-2">
                <Label>Learning Objectives</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  What should students be able to do after completing this course?
                </p>
                
                {learningObjectives.map((objective, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <Input
                      value={objective}
                      onChange={(e) => handleObjectiveChange(index, e.target.value)}
                      placeholder={`Learning objective ${index + 1}`}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => removeObjective(index)}
                      disabled={learningObjectives.length <= 1}
                    >
                      -
                    </Button>
                  </div>
                ))}
                
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addObjective}
                >
                  Add Learning Objective
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Content Configuration</CardTitle>
              <CardDescription>
                Configure what type of content should be included in the generated course
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Module Count */}
              <div className="space-y-2">
                <Label htmlFor="moduleCount">Number of Modules</Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="moduleCount"
                    name="moduleCount"
                    type="number"
                    min={1}
                    max={10}
                    value={courseRequest.moduleCount}
                    onChange={(e) => handleChange({
                      target: {
                        name: "moduleCount",
                        value: e.target.value ? parseInt(e.target.value).toString() : "1"
                      }
                    })}
                    className="w-20"
                  />
                  <span className="text-sm text-muted-foreground">
                    (1-10 modules)
                  </span>
                </div>
              </div>
              
              {/* Content Inclusions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeQuizzes"
                    checked={courseRequest.includeQuizzes}
                    onCheckedChange={(checked) => 
                      handleCheckboxChange("includeQuizzes", checked as boolean)
                    }
                  />
                  <Label htmlFor="includeQuizzes">Include Quizzes</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeAssignments"
                    checked={courseRequest.includeAssignments}
                    onCheckedChange={(checked) => 
                      handleCheckboxChange("includeAssignments", checked as boolean)
                    }
                  />
                  <Label htmlFor="includeAssignments">Include Assignments</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeResources"
                    checked={courseRequest.includeResources}
                    onCheckedChange={(checked) => 
                      handleCheckboxChange("includeResources", checked as boolean)
                    }
                  />
                  <Label htmlFor="includeResources">Include Resources</Label>
                </div>
              </div>

              {/* Generation Mode */}
              <div className="space-y-2 pt-2">
                <Label htmlFor="generationMode">Generation Mode</Label>
                <Select 
                  value={courseRequest.generationMode} 
                  onValueChange={(value) => handleSelectChange("generationMode", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select generation mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft (Faster, less detailed)</SelectItem>
                    <SelectItem value="complete">Complete (Slower, comprehensive)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Personalization</CardTitle>
              <CardDescription>
                Configure how the content should be personalized for the learner
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Personalization Toggles */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="adaptToLearningStyle">Adapt to Learning Style</Label>
                    <p className="text-sm text-muted-foreground">
                      Adjust content based on learning preferences
                    </p>
                  </div>
                  <Switch
                    id="adaptToLearningStyle"
                    checked={courseRequest.personalization?.adaptToLearningStyle}
                    onCheckedChange={(checked) => 
                      handlePersonalizationChange("adaptToLearningStyle", checked)
                    }
                  />
                </div>
                
                {/* Difficulty Level */}
                <div className="space-y-2">
                  <Label htmlFor="difficultyLevel">Difficulty Level</Label>
                  <Select 
                    value={courseRequest.personalization?.difficultyLevel || "medium"} 
                    onValueChange={(value) => handlePersonalizationChange("difficultyLevel", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                      <SelectItem value="adaptive">Adaptive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Pace Adjustment */}
                <div className="space-y-2">
                  <Label htmlFor="paceAdjustment">Learning Pace</Label>
                  <Select 
                    value={courseRequest.personalization?.paceAdjustment || "moderate"} 
                    onValueChange={(value) => handlePersonalizationChange("paceAdjustment", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select pace" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="slow">Slow</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="fast">Fast</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Interest Areas */}
                <div className="space-y-2">
                  <Label>Interest Areas</Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    Specific topics the learner is interested in
                  </p>
                  
                  {interestAreas.map((interest, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <Input
                        value={interest}
                        onChange={(e) => handleInterestChange(index, e.target.value)}
                        placeholder={`Interest area ${index + 1}`}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => removeInterest(index)}
                        disabled={interestAreas.length <= 1}
                      >
                        -
                      </Button>
                    </div>
                  ))}
                  
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addInterest}
                  >
                    Add Interest Area
                  </Button>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={handleReset}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Reset
              </Button>
              <Button onClick={handleGenerate} disabled={isGenerating || !courseRequest.title.trim()}>
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>Generate Course</>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Results Tab */}
        <TabsContent value="results" className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {isGenerating ? (
            <LoadingSkeleton />
          ) : generatedCourse ? (
            <>
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{generatedCourse.title}</CardTitle>
                      <CardDescription>
                        For {generatedCourse.targetAudience} • {generatedCourse.estimatedDuration}
                      </CardDescription>
                    </div>
                    <Badge variant={saveStatus === "saved" ? "default" : "outline"}>
                      {saveStatus === "saved" ? "Saved" : "Draft"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold">Description</h3>
                    <p>{generatedCourse.description}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold">Learning Objectives</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      {generatedCourse.learningObjectives.map((objective, i) => (
                        <li key={i}>{objective}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold">Modules ({generatedCourse.modules.length})</h3>
                    <ul className="space-y-3 mt-2">
                      {generatedCourse.modules.map((module, i) => (
                        <li key={i}>
                          <div className="font-medium">{module.title}</div>
                          <div className="text-sm text-muted-foreground">{module.description}</div>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {generatedCourse.quizzes?.length ? (
                    <div>
                      <h3 className="text-lg font-semibold">Quizzes ({generatedCourse.quizzes.length})</h3>
                      <div className="text-sm text-muted-foreground">
                        {generatedCourse.quizzes.length} quizzes with {
                          generatedCourse.quizzes.reduce((acc, quiz) => acc + (quiz.questions?.length || 0), 0)
                        } total questions
                      </div>
                    </div>
                  ) : null}
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" onClick={() => setActiveTab("configuration")}>
                    Back to Configuration
                  </Button>
                  <Button 
                    onClick={handleSaveCourse} 
                    disabled={saveStatus === "saving" || saveStatus === "saved"}
                  >
                    {saveStatus === "saving" ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : saveStatus === "saved" ? (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Saved!
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Course
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Raw JSON Output</CardTitle>
                  <CardDescription>
                    The complete data returned from the AI generation system
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <JSONView data={generatedCourse} />
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="text-center py-12">
              <h3 className="text-xl font-medium mb-2">No Generated Content Yet</h3>
              <p className="text-muted-foreground mb-6">
                Go to the Configuration tab to set up your course parameters and generate content.
              </p>
              <Button onClick={() => setActiveTab("configuration")}>
                Configure Course
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
} 