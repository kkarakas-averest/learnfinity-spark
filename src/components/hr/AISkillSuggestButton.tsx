import { useState } from '@/lib/react-helpers';
import { Button } from '@/components/ui/button';
import type { TaxonomySkill } from './TaxonomySkillPicker';
import { toast } from 'sonner';

type Props = {
  positionTitle: string;
  onSuggest: (skills: TaxonomySkill[]) => void;
};

export function AISkillSuggestButton({ positionTitle, onSuggest }: Props) {
  const [loading, setLoading] = useState(false);

  const handleSuggest = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ai/suggest-skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ positionTitle }),
      });
      if (!res.ok) throw new Error('Failed to get AI suggestions');
      const data = await res.json();
      if (data.success && Array.isArray(data.skills)) {
        onSuggest(data.skills);
        toast.success('AI skill suggestions loaded');
      } else {
        throw new Error(data.error || 'No skills returned');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error getting AI suggestions');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleSuggest}
      disabled={loading}
      title={`Suggest skills for ${positionTitle}`}
    >
      {loading ? 'Suggesting...' : 'Suggest Skills (AI)'}
    </Button>
  );
} 