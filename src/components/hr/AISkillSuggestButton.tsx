import { Button } from "@/components/ui/button";
import { useState } from '@/lib/react-helpers';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

// Helper function to get API URL
const getApiUrl = (path: string) => {
  return path;
};

type Props = {
  positionId: string;
  positionTitle: string;
  departmentId?: string;
  departmentName?: string;
  onSuggestionsApplied: (appliedCount: number) => void;
};

export function AISkillSuggestButton({ 
  positionId, 
  positionTitle, 
  departmentId,
  departmentName,
  onSuggestionsApplied 
}: Props) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);
    try {
      // First, get any existing context
      const contextResponse = await fetch(getApiUrl(`/api/skills/position-requirements?positionId=${positionId}`));
      if (!contextResponse.ok) throw new Error('Failed to fetch existing requirements');
      const existingData = await contextResponse.json();
      
      // Call the AI suggestion endpoint
      const response = await fetch(getApiUrl('/api/ai/suggest-skills'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          positionId,
          positionTitle,
          departmentId,
          departmentName,
          existingSkills: existingData.data?.map((req: any) => req.skill_name) || []
        }),
      });

      if (!response.ok) throw new Error('Failed to get suggestions');
      
      const result = await response.json();
      
      if (!result.success || !result.data || !result.data.suggestions) {
        throw new Error('Invalid suggestion response');
      }
      
      // Apply suggestions to position
      const applyResponse = await fetch(getApiUrl('/api/skills/position-requirements/apply-suggestions'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          positionId,
          suggestions: result.data.suggestions
        }),
      });
      
      if (!applyResponse.ok) throw new Error('Failed to apply suggestions');
      const applyResult = await applyResponse.json();
      
      // Notify parent component
      onSuggestionsApplied(applyResult.data?.appliedCount || 0);
      
      toast.success(`Added ${applyResult.data?.appliedCount || 0} AI-suggested skills to position`);
    } catch (error: any) {
      console.error('Error getting skill suggestions:', error);
      toast.error(error.message || 'Failed to get skill suggestions');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleClick}
      variant="secondary"
      size="sm"
      disabled={isLoading}
    >
      {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
      AI Suggest Skills
    </Button>
  );
} 