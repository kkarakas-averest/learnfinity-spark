import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Sparkles, BookOpen, User, BarChart2, 
  FileText, Layers, Star, Clock, 
  Zap, Settings, Award, ArrowRight 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AICourseRecommendations from '@/components/learner/AICourseRecommendations';

// Add useState and useEffect
const { useState } = React;

const AILearningCenter: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center">
            <Sparkles className="mr-2 h-6 w-6 text-primary" />
            AI Learning Center
          </h1>
          <p className="text-muted-foreground">
            Discover how AI enhances your learning experience
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <Button asChild variant="outline">
            <Link to="/learner" className="flex items-center">
              <ArrowRight className="mr-2 h-4 w-4 rotate-180" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="overview" className="flex items-center">
            <Layers className="mr-2 h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="recommendations" className="flex items-center">
            <Star className="mr-2 h-4 w-4" />
            Recommendations
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center">
            <Zap className="mr-2 h-4 w-4" />
            Learning Insights
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center">
            <Settings className="mr-2 h-4 w-4" />
            AI Preferences
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-primary/10 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Sparkles className="mr-2 h-5 w-5 text-primary" />
                  Welcome to AI-Enhanced Learning
                </CardTitle>
                <CardDescription>
                  LearnFinity's AI system transforms your educational journey
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-4">
                  Our AI learning system is designed to transform how you learn by creating 
                  personalized experiences that adapt to your unique needs, preferences, and goals.
                </p>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-start space-x-3">
                    <BookOpen className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <h3 className="font-medium">Personalized Learning Paths</h3>
                      <p className="text-sm text-muted-foreground">
                        Customized learning journeys based on your skills and goals
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Star className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <h3 className="font-medium">Smart Recommendations</h3>
                      <p className="text-sm text-muted-foreground">
                        Discover the most relevant content for your development
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Zap className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <h3 className="font-medium">Personalized Insights</h3>
                      <p className="text-sm text-muted-foreground">
                        Receive tips and connections tailored to your learning style
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Clock className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <h3 className="font-medium">Adaptive Pacing</h3>
                      <p className="text-sm text-muted-foreground">
                        Learning sequences that adjust to your optimal pace
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="default" className="w-full sm:w-auto" asChild>
                  <Link to="/courses" className="flex items-center">
                    Explore AI-Enhanced Courses 
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>How Our AI Works</CardTitle>
                <CardDescription>
                  The technology behind your personalized learning experience
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="rounded-full bg-primary/10 p-2 flex-shrink-0">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">Analyzer Agent</h3>
                    <p className="text-sm text-muted-foreground">
                      Evaluates your learning patterns and determines your current status
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="rounded-full bg-primary/10 p-2 flex-shrink-0">
                    <BookOpen className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">Educator Agent</h3>
                    <p className="text-sm text-muted-foreground">
                      Creates personalized learning paths and content recommendations
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="rounded-full bg-primary/10 p-2 flex-shrink-0">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">Integrator Agent</h3>
                    <p className="text-sm text-muted-foreground">
                      Combines information from multiple sources to generate comprehensive insights
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="rounded-full bg-primary/10 p-2 flex-shrink-0">
                    <BarChart2 className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">Monitor Agent</h3>
                    <p className="text-sm text-muted-foreground">
                      Tracks your progress and engagement to offer timely interventions
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="mt-10 space-y-4">
            <h2 className="text-2xl font-bold flex items-center">
              <Award className="mr-2 h-5 w-5 text-primary" />
              Featured AI-Enhanced Courses
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((index) => (
                <Card key={index}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Advanced Machine Learning</CardTitle>
                    <CardDescription>
                      Master ML algorithms with personalized guidance
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                      <div className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        <span>8 hours</span>
                      </div>
                      <div className="flex items-center">
                        <User className="h-3 w-3 mr-1" />
                        <span>2.4k enrolled</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Sparkles className="h-3 w-3 text-primary" />
                      <span className="text-xs">AI-customized for your skill level</span>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" className="w-full" asChild>
                      <Link to={`/courses/${index}`}>View Course</Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="recommendations">
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Personalized Course Recommendations</h2>
              <p className="text-muted-foreground mb-6">
                Courses selected specifically for you based on your skills, interests, and learning history
              </p>
            </div>
            
            <AICourseRecommendations />
          </div>
        </TabsContent>
        
        <TabsContent value="insights">
          <Card>
            <CardHeader>
              <CardTitle>Your Learning Insights</CardTitle>
              <CardDescription>
                AI-generated insights to improve your learning experience
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="bg-muted p-4 rounded-md text-center">
                To view personalized insights, please enroll and begin a course with AI-enhanced learning.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-blue-200">
                  <CardHeader className="pb-2 text-blue-600">
                    <h3 className="text-sm font-semibold">Learning Style</h3>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">
                      Based on your interactions, you appear to learn best through visual content and hands-on exercises.
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="border-amber-200">
                  <CardHeader className="pb-2 text-amber-600">
                    <h3 className="text-sm font-semibold">Skill Gaps</h3>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">
                      Consider strengthening your foundation in data structures and algorithms for better progress.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full sm:w-auto" asChild>
                <Link to="/courses">
                  Find Courses to Generate Insights
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle>AI Preferences</CardTitle>
              <CardDescription>
                Customize how our AI interacts with you and personalizes your learning
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-6">
                This feature is coming soon! You'll be able to:
              </p>
              <ul className="space-y-2 list-disc pl-6 text-sm">
                <li>Set your preferred learning pace</li>
                <li>Prioritize types of content you prefer</li>
                <li>Adjust how often you receive AI-generated insights</li>
                <li>Customize how deeply AI adapts your learning path</li>
                <li>Control your data usage for AI personalization</li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AILearningCenter; 