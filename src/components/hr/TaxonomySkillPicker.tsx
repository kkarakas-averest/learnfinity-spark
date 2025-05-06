import { useState } from '@/lib/react-helpers';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

// Helper function to get full API URL, matching the one in other components
const getApiUrl = (path: string) => {
  // Use window.location.origin to get the current base URL
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  return `${baseUrl}${path}`;
};

export type TaxonomySkill = {
  id: string;
  name: string;
  group_id: string;
  group_name: string;
  subcategory_id: string;
  subcategory_name: string;
  category_id: string;
  category_name: string;
};

type Props = {
  open: boolean;
  onSelect: (skill: TaxonomySkill) => void;
  onClose: () => void;
};

export function TaxonomySkillPicker({ open, onSelect, onClose }: Props) {
  const [search, setSearch] = useState('');

  const { data, isLoading, error } = useQuery<{ skills: TaxonomySkill[] }, Error>({
    queryKey: ['taxonomy-skills', search],
    queryFn: async () => {
      try {
        const res = await fetch(getApiUrl(`/api/skills/taxonomy-search?q=${encodeURIComponent(search)}`));
        if (!res.ok) {
          console.error('API response error:', await res.text());
          throw new Error(`Failed to fetch skills: ${res.status}`);
        }
        return res.json();
      } catch (err) {
        console.error('Taxonomy skills fetch error:', err);
        throw new Error('Failed to load skills data. See console for details.');
      }
    },
    enabled: open,
  });

  console.log('TaxonomySkillPicker rendering:', { data, isLoading, error });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Pick a Skill</DialogTitle>
        </DialogHeader>
        <Input
          placeholder="Search skills..."
          value={search}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
          className="mb-4"
        />
        {isLoading && <div>Loading...</div>}
        {error && <div className="text-red-500">{error.message}</div>}
        <div className="max-h-64 overflow-y-auto">
          {data?.skills?.length === 0 && <div>No skills found.</div>}
          {data?.skills?.map(skill => (
            <div key={skill.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
              <div>
                <div className="font-medium">{skill.name}</div>
                <div className="text-xs text-muted-foreground">
                  {skill.category_name} / {skill.subcategory_name} / {skill.group_name}
                </div>
              </div>
              <Button size="sm" onClick={() => onSelect(skill)}>
                Add
              </Button>
            </div>
          ))}
        </div>
        <div className="mt-4 text-right">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 