import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LearningActivity, CourseCompletion } from '@/types/employee-profile.types';
import { AlertTriangle, CheckCircle, Award, Clock, Calendar, BookOpen, FileText, Video, Target, BarChart2, MessageSquare } from 'lucide-react';

interface LearningHistoryProps {
  completedCourses: CourseCompletion[];
  learningActivities: LearningActivity[];
  isLoading?: boolean;
}

/**
 * Format a date for display
 */
const formatDate = (dateString: string): string => {
  if (!dateString) return 'N/A';
  
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  };
  
  try {
    return new Date(dateString).toLocaleDateString(undefined, options);
  } catch (e) {
    return dateString;
  }
};

/**
 * Format a timestamp for displaying time
 */
const formatTime = (timestamp: string): string => {
  if (!timestamp) return '';
  
  try {
    const date = new Date(timestamp);
    return date.toLocaleTimeString(undefined, { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  } catch (e) {
    return '';
  }
};

/**
 * Get an icon for a learning activity type
 */
const getActivityIcon = (type: string) => {
  switch (type) {
    case 'course_progress':
      return <BookOpen className="h-4 w-4" />;
    case 'assessment':
      return <FileText className="h-4 w-4" />;
    case 'resource_access':
      return <Video className="h-4 w-4" />;
    case 'forum_activity':
      return <MessageSquare className="h-4 w-4" />;
    case 'exercise_completion':
      return <Target className="h-4 w-4" />;
    default:
      return <Clock className="h-4 w-4" />;
  }
};

/**
 * Get color class for activity type
 */
const getActivityColor = (type: string): string => {
  switch (type) {
    case 'course_progress':
      return 'bg-blue-100 text-blue-800';
    case 'assessment':
      return 'bg-purple-100 text-purple-800';
    case 'resource_access':
      return 'bg-green-100 text-green-800';
    case 'forum_activity':
      return 'bg-yellow-100 text-yellow-800';
    case 'exercise_completion':
      return 'bg-indigo-100 text-indigo-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

/**
 * Group activities by date
 */
const groupActivitiesByDate = (activities: LearningActivity[]) => {
  return activities.reduce((groups, activity) => {
    const date = new Date(activity.timestamp).toISOString().split('T')[0];
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(activity);
    return groups;
  }, {} as Record<string, LearningActivity[]>);
};

/**
 * LearningHistory Component
 * 
 * Displays an employee's learning history including course completions and
 * learning activities in a timeline format
 */
const LearningHistory: React.FC<LearningHistoryProps> = ({
  completedCourses,
  learningActivities,
  isLoading = false
}) => {
  const [activeTab, setActiveTab] = React.useState('timeline');
  
  // Sort activities by timestamp (newest first)
  const sortedActivities = [...learningActivities].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  
  // Sort courses by completion date (newest first)
  const sortedCourses = [...completedCourses].sort((a, b) => 
    new Date(b.completionDate).getTime() - new Date(a.completionDate).getTime()
  );
  
  // Group activities by date
  const activitiesByDate = groupActivitiesByDate(sortedActivities);
  const groupedDates = Object.keys(activitiesByDate).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Learning History</CardTitle>
          <CardDescription>Loading history data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <span>Loading...</span>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (!completedCourses.length && !learningActivities.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Learning History</CardTitle>
          <CardDescription>No learning history recorded</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
              <p className="text-muted-foreground">
                No learning activities or course completions have been recorded for this employee.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Learning History</CardTitle>
        <CardDescription>
          Course completions and learning activities
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="timeline">
              <Clock className="h-4 w-4 mr-2" />
              Timeline
            </TabsTrigger>
            <TabsTrigger value="courses">
              <Award className="h-4 w-4 mr-2" />
              Completed Courses
            </TabsTrigger>
            <TabsTrigger value="stats">
              <BarChart2 className="h-4 w-4 mr-2" />
              Statistics
            </TabsTrigger>
          </TabsList>
          
          {/* Timeline Tab */}
          <TabsContent value="timeline" className="space-y-4">
            <ScrollArea className="h-[350px] pr-4">
              {groupedDates.length === 0 ? (
                <div className="flex items-center justify-center h-32">
                  <p className="text-muted-foreground">No recent learning activities</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {groupedDates.map(date => (
                    <div key={date} className="space-y-2">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                        <h3 className="text-sm font-medium">{formatDate(date)}</h3>
                      </div>
                      
                      <div className="ml-6 space-y-2">
                        {activitiesByDate[date].map(activity => (
                          <div 
                            key={activity.id} 
                            className="flex items-start space-x-3 border-l-2 border-l-gray-200 pl-4 pb-2"
                          >
                            <div className={`rounded-full p-1.5 ${getActivityColor(activity.type)}`}>
                              {getActivityIcon(activity.type)}
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex items-center">
                                <Badge variant="outline" className="rounded-sm capitalize text-xs">
                                  {activity.type.replace('_', ' ')}
                                </Badge>
                                <span className="text-xs text-muted-foreground ml-2">
                                  {formatTime(activity.timestamp)}
                                </span>
                              </div>
                              
                              <p className="text-sm font-medium mt-1">
                                {activity.details.resourceName || 'Unnamed resource'}
                              </p>
                              
                              <div className="grid grid-cols-2 gap-2 mt-1">
                                {activity.details.duration && (
                                  <div className="text-xs text-muted-foreground">
                                    <Clock className="h-3 w-3 inline mr-1" />
                                    {activity.details.duration} min
                                  </div>
                                )}
                                
                                {activity.details.progress && (
                                  <div className="text-xs text-muted-foreground">
                                    <Target className="h-3 w-3 inline mr-1" />
                                    {activity.details.progress}% complete
                                  </div>
                                )}
                                
                                {activity.details.score && (
                                  <div className="text-xs text-muted-foreground">
                                    <Award className="h-3 w-3 inline mr-1" />
                                    Score: {activity.details.score}%
                                  </div>
                                )}
                              </div>
                              
                              {activity.details.comments && (
                                <p className="text-xs text-muted-foreground mt-1 italic">
                                  "{activity.details.comments}"
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
          
          {/* Completed Courses Tab */}
          <TabsContent value="courses" className="space-y-4">
            <ScrollArea className="h-[350px] pr-4">
              {sortedCourses.length === 0 ? (
                <div className="flex items-center justify-center h-32">
                  <p className="text-muted-foreground">No completed courses yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {sortedCourses.map(course => (
                    <div 
                      key={course.courseId} 
                      className="border rounded-lg p-4 hover:border-primary transition-colors"
                    >
                      <div className="flex justify-between">
                        <div>
                          <h3 className="font-medium">{course.courseName}</h3>
                          <p className="text-sm text-muted-foreground">
                            Completed on {formatDate(course.completionDate)}
                          </p>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-5 w-5 text-green-500" />
                          {course.score && (
                            <Badge className="bg-blue-500 text-white">
                              Score: {course.score}%
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center mt-3 space-x-3">
                        {course.feedbackProvided && (
                          <Badge variant="outline" className="text-xs">
                            Feedback Provided
                          </Badge>
                        )}
                        
                        {course.certificateUrl && (
                          <a 
                            href={course.certificateUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline"
                          >
                            View Certificate
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
          
          {/* Statistics Tab */}
          <TabsContent value="stats" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Course Completion Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {completedCourses.length > 0 
                      ? Math.round((completedCourses.length / (completedCourses.length + 2)) * 100) 
                      : 0}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {completedCourses.length} courses completed
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Average Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {completedCourses.some(c => c.score !== undefined)
                      ? Math.round(
                          completedCourses
                            .filter(c => c.score !== undefined)
                            .reduce((sum, c) => sum + (c.score || 0), 0) / 
                          completedCourses.filter(c => c.score !== undefined).length
                        )
                      : 'N/A'}
                    {completedCourses.some(c => c.score !== undefined) ? '%' : ''}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {completedCourses.filter(c => c.score !== undefined).length} scored assessments
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {learningActivities.length > 0 
                      ? formatDate(sortedActivities[0].timestamp).split(' ').slice(0, 2).join(' ')
                      : 'None'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Last activity recorded
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Activity Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {['course_progress', 'assessment', 'resource_access', 'forum_activity', 'exercise_completion']
                      .map(type => {
                        const count = learningActivities.filter(a => a.type === type).length;
                        if (count === 0) return null;
                        
                        return (
                          <Badge key={type} className={`${getActivityColor(type)} capitalize text-xs`}>
                            {type.replace('_', ' ')}: {count}
                          </Badge>
                        );
                      })
                      .filter(Boolean)}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default LearningHistory; 