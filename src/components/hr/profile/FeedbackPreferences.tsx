import React from '@/lib/react-helpers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { EnhancedEmployeeProfile } from '@/types/employee-profile.types';
import { Star, MessageSquare, Pencil } from 'lucide-react';
import { ThumbsUp, ThumbsDown } from '@/components/ui/icons/index';

interface FeedbackPreferencesProps {
  profile: EnhancedEmployeeProfile | null;
  isEditable?: boolean;
  onEdit?: () => void;
}

/**
 * FeedbackPreferences Component
 * 
 * Displays an employee's content feedback and topic preferences
 */
const FeedbackPreferences: React.FC<FeedbackPreferencesProps> = ({
  profile,
  isEditable = false,
  onEdit,
}) => {
  const [activeTab, setActiveTab] = React.useState('feedback-history');

  if (!profile) {
    return (
      <Card className="w-full mb-6">
        <CardHeader>
          <CardTitle>Feedback & Preferences</CardTitle>
          <CardDescription>Content feedback and topic preferences</CardDescription>
        </CardHeader>
        <CardContent>
          <p>No feedback data available</p>
        </CardContent>
      </Card>
    );
  }

  const { contentFeedback } = profile;
  const { preferredTopics, dislikedTopics, averageRating, feedbackHistory } = contentFeedback;

  // Sort feedback history by date (most recent first)
  const sortedFeedbackHistory = [...feedbackHistory].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Function to render star rating
  const renderStarRating = (rating: number) => {
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <Star 
            key={i} 
            className={`h-4 w-4 ${i < rating ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground'}`} 
          />
        ))}
        <span className="ml-2 text-sm">{rating.toFixed(1)}</span>
      </div>
    );
  };

  const handleEdit = () => {
    if (isEditable && onEdit) {
      onEdit();
    }
  };

  return (
    <Card className="w-full mb-6">
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle>Feedback & Preferences</CardTitle>
          <CardDescription>Content feedback and topic preferences</CardDescription>
        </div>
        {isEditable && (
          <Button variant="outline" size="sm" onClick={handleEdit}>
            <Pencil className="h-4 w-4 mr-2" />
            Edit Preferences
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-2">Overall Feedback Score</h3>
          <div className="flex items-center space-x-4 mb-4">
            <div className="flex-1">
              <Progress value={averageRating * 20} className="h-2" />
            </div>
            <div className="flex items-center">
              {renderStarRating(averageRating)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="text-lg font-medium mb-2">Preferred Topics</h3>
            {preferredTopics.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {preferredTopics.map((topic, index) => (
                  <Badge key={index} variant="outline" className="flex items-center">
                    <ThumbsUp className="h-3 w-3 mr-1 text-green-500" />
                    {topic}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No preferred topics recorded</p>
            )}
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-2">Topics to Improve</h3>
            {dislikedTopics.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {dislikedTopics.map((topic, index) => (
                  <Badge key={index} variant="outline" className="flex items-center">
                    <ThumbsDown className="h-3 w-3 mr-1 text-red-500" />
                    {topic}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No improvement areas recorded</p>
            )}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="feedback-history" className="flex items-center">
              <MessageSquare className="h-4 w-4 mr-2" />
              Feedback History
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="feedback-history">
            {sortedFeedbackHistory.length > 0 ? (
              <div className="space-y-4">
                {sortedFeedbackHistory.map((feedback, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium">{feedback.contentType}</h4>
                          <p className="text-sm text-muted-foreground">
                            {new Date(feedback.date).toLocaleDateString()}
                          </p>
                        </div>
                        <div>{renderStarRating(feedback.rating)}</div>
                      </div>
                      {feedback.comments && (
                        <div className="mt-2 text-sm">
                          <p className="italic">"{feedback.comments}"</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No feedback history available</p>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default FeedbackPreferences; 