import { useState } from '@/lib/react-helpers';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

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

  const { data, isLoading, error } = useQuery<{ success: boolean; data: TaxonomySkill[] }, Error>({
    queryKey: ['taxonomy-skills', search],
    queryFn: async () => {
      const res = await fetch(`/api/skills/taxonomy-search?q=${encodeURIComponent(search)}`);
      if (!res.ok) throw new Error('Failed to fetch skills');
      return res.json();
    },
    enabled: open,
  });

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
          {data?.data?.length === 0 && <div>No skills found.</div>}
          {data?.data?.map(skill => (
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