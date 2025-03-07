import React, { useState, useEffect } from '@/lib/react-helpers';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ContentModification } from '@/types/intervention.types';

interface ContentModificationFormProps {
  initialValue?: ContentModification;
  onSave: (contentModification: ContentModification) => void;
  onCancel: () => void;
  availableContent?: { id: string; title: string; type: string }[];
}

/**
 * ContentModificationForm Component
 * 
 * A form for HR to create or edit content modifications as part of interventions
 */
const ContentModificationForm: React.FC<ContentModificationFormProps> = ({
  initialValue,
  onSave,
  onCancel,
  availableContent = []
}) => {
  // Form state
  const [contentId, setContentId] = useState<string>(initialValue?.contentId || '');
  const [contentType, setContentType] = useState<'module' | 'quiz' | 'video' | 'document' | 'other'>(
    initialValue?.contentType || 'module'
  );
  const [originalContent, setOriginalContent] = useState<string>(initialValue?.originalContent || '');
  const [modifiedContent, setModifiedContent] = useState<string>(initialValue?.modifiedContent || '');
  const [reason, setReason] = useState<string>(initialValue?.reason || '');
  const [loading, setLoading] = useState<boolean>(false);
  const [preview, setPreview] = useState<boolean>(false);
  
  // Load original content when content ID changes
  useEffect(() => {
    const loadOriginalContent = async () => {
      if (!contentId) return;
      
      try {
        setLoading(true);
        
        // In a real implementation, fetch content from API
        // This is a mock implementation
        setTimeout(() => {
          const mockContent = `# Original Content for ID: ${contentId}

This is a sample content that would be loaded from the API based on the selected content ID.
It could include text, code examples, or other formatting.

## Section 1
- Point 1
- Point 2
- Point 3

## Section 2
Here's some more content...`;
          
          setOriginalContent(mockContent);
          
          // If this is a new content modification, initialize the modified content with the original
          if (!initialValue) {
            setModifiedContent(mockContent);
          }
          
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error loading original content:', error);
        setLoading(false);
      }
    };
    
    loadOriginalContent();
  }, [contentId, initialValue]);
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!contentId || !contentType || !modifiedContent || !reason) {
      // Show error message
      return;
    }
    
    // Create content modification object
    const contentModification: ContentModification = {
      contentId,
      contentType,
      originalContent,
      modifiedContent,
      reason
    };
    
    // Call onSave callback
    onSave(contentModification);
  };
  
  // Filter available content types based on selected content
  const selectedContent = availableContent.find(c => c.id === contentId);
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Modify Learning Content</CardTitle>
        <CardDescription>
          Make changes to the learning content as part of an intervention
        </CardDescription>
      </CardHeader>
      
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {/* Content Selection */}
          <div className="space-y-1">
            <Label htmlFor="content-id">Content to Modify</Label>
            <Select 
              value={contentId} 
              onValueChange={setContentId}
              disabled={loading || !!initialValue /* can't change content after creation */}
            >
              <SelectTrigger id="content-id">
                <SelectValue placeholder="Select content to modify" />
              </SelectTrigger>
              <SelectContent>
                {availableContent.length === 0 ? (
                  <SelectItem value="no-content" disabled>
                    No content available
                  </SelectItem>
                ) : (
                  availableContent.map(content => (
                    <SelectItem key={content.id} value={content.id}>
                      {content.title} ({content.type})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          
          {/* Content Type */}
          <div className="space-y-1">
            <Label htmlFor="content-type">Content Type</Label>
            <Select 
              value={contentType} 
              onValueChange={(value) => setContentType(value as any)}
              disabled={loading || !!selectedContent /* use content type from selected content */}
            >
              <SelectTrigger id="content-type">
                <SelectValue placeholder="Select content type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="module">Module</SelectItem>
                <SelectItem value="quiz">Quiz</SelectItem>
                <SelectItem value="video">Video</SelectItem>
                <SelectItem value="document">Document</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Reason for modification */}
          <div className="space-y-1">
            <Label htmlFor="reason">Reason for Modification</Label>
            <Textarea
              id="reason"
              placeholder="Why is this content being modified?"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              disabled={loading}
            />
          </div>
          
          {/* Content Editor Tabs */}
          <div className="space-y-2 pt-4">
            <div className="flex border-b">
              <button
                type="button"
                className={`px-4 py-2 font-medium ${!preview ? 'border-b-2 border-primary' : 'text-gray-500'}`}
                onClick={() => setPreview(false)}
              >
                Edit
              </button>
              <button
                type="button"
                className={`px-4 py-2 font-medium ${preview ? 'border-b-2 border-primary' : 'text-gray-500'}`}
                onClick={() => setPreview(true)}
              >
                Preview
              </button>
            </div>
            
            {/* Original Content */}
            <div className="space-y-1">
              <Label>Original Content</Label>
              <div className="border rounded-md p-4 bg-gray-50 min-h-[200px] max-h-[300px] overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center h-[200px]">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                ) : originalContent ? (
                  <pre className="whitespace-pre-wrap font-mono text-sm">{originalContent}</pre>
                ) : (
                  <div className="text-gray-400 italic">
                    Select content to view the original version
                  </div>
                )}
              </div>
            </div>
            
            {/* Modified Content */}
            <div className="space-y-1">
              <Label>Modified Content</Label>
              {preview ? (
                <div className="border rounded-md p-4 min-h-[200px] max-h-[400px] overflow-y-auto">
                  {modifiedContent ? (
                    <pre className="whitespace-pre-wrap font-mono text-sm">{modifiedContent}</pre>
                  ) : (
                    <div className="text-gray-400 italic">
                      No modified content yet
                    </div>
                  )}
                </div>
              ) : (
                <Textarea
                  value={modifiedContent}
                  onChange={(e) => setModifiedContent(e.target.value)}
                  placeholder="Enter the modified content here..."
                  rows={12}
                  disabled={loading || !contentId}
                  className="font-mono"
                />
              )}
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading || !contentId || !modifiedContent || !reason}>
            Save Changes
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default ContentModificationForm; 