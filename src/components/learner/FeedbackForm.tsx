import React from '@/lib/react-helpers';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Star } from 'lucide-react';

interface FeedbackFormProps {
  courseId: string;
  onSubmit: (data: { rating: number; comments: string }) => Promise<void>;
  onCancel: () => void;
}

export const FeedbackForm: React.FC<FeedbackFormProps> = ({ courseId, onSubmit, onCancel }) => {
  const { register, handleSubmit, formState, setValue, watch } = useForm({
    defaultValues: {
      rating: 0,
      comments: ''
    }
  });
  
  const rating = watch('rating');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  
  const submitForm = async (data: { rating: number; comments: string }) => {
    try {
      setIsSubmitting(true);
      await onSubmit(data);
    } catch (error) {
      console.error('Error submitting feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Course Feedback</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit(submitForm)}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>How would you rate this course?</Label>
            <div className="flex items-center space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <HoverCard key={star} openDelay={300}>
                  <HoverCardTrigger asChild>
                    <button
                      type="button"
                      className={`rounded-md p-1 focus:outline-none focus:ring-1 focus:ring-primary`}
                      onClick={() => setValue('rating', star)}
                    >
                      <Star 
                        className={`h-7 w-7 ${
                          rating >= star 
                            ? 'text-yellow-400 fill-yellow-400' 
                            : 'text-gray-300'
                        }`} 
                      />
                    </button>
                  </HoverCardTrigger>
                  <HoverCardContent className="py-1 px-2" side="top">
                    {star === 1 && 'Poor'}
                    {star === 2 && 'Fair'}
                    {star === 3 && 'Good'}
                    {star === 4 && 'Very Good'}
                    {star === 5 && 'Excellent'}
                  </HoverCardContent>
                </HoverCard>
              ))}
              <span className="ml-2 text-sm text-muted-foreground">
                {rating === 0 && 'Not rated'}
                {rating === 1 && 'Poor'}
                {rating === 2 && 'Fair'}
                {rating === 3 && 'Good'}
                {rating === 4 && 'Very Good'}
                {rating === 5 && 'Excellent'}
              </span>
            </div>
            {formState.errors.rating && (
              <p className="text-sm text-destructive">Please select a rating</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="comments">What feedback do you have about this course?</Label>
            <Textarea
              id="comments"
              placeholder="Your feedback helps us improve our courses"
              className="min-h-[100px]"
              {...register('comments')}
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            disabled={isSubmitting || rating === 0}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default FeedbackForm; 