import { Button } from "@/components/ui/button";
import { useState } from '@/lib/react-helpers';
import type { TaxonomySkill } from './TaxonomySkillPicker';
import { toast } from 'sonner';

// Helper function to get full API URL
const getApiUrl = (path: string) => {
  // Use window.location.origin to get the current base URL
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  return `${baseUrl}${path}`;
};

type AISkillSuggestButtonProps = {
  positionTitle: string;
  onSuggest: (skills: TaxonomySkill[]) => void;
};

export function AISkillSuggestButton({
  positionTitle,
  onSuggest,
}: AISkillSuggestButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    if (!positionTitle) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(
        getApiUrl(`/api/ai/suggest-skills?positionTitle=${encodeURIComponent(positionTitle)}`)
      );
      
      if (!response.ok) {
        throw new Error("Failed to suggest skills");
      }
      
      const data = await response.json();
      if (data.skills && Array.isArray(data.skills)) {
        onSuggest(data.skills);
        toast.success('AI skill suggestions loaded');
      } else {
        throw new Error(data.error || 'No skills returned');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error suggesting skills');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={isLoading}
      title={`Suggest skills for ${positionTitle}`}
    >
      {isLoading ? "Suggesting..." : "AI Suggest Skills"}
    </Button>
  );
} 