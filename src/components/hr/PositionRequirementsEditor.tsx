import { useState } from '@/lib/react-helpers';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TaxonomySkillPicker } from './TaxonomySkillPicker';
import { AISkillSuggestButton } from './AISkillSuggestButton';
import { toast } from 'sonner';

// Helper function to get full API URL, matching the one in PositionRequirementsPage
const getApiUrl = (path: string) => {
  // Use window.location.origin to get the current base URL
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  return `${baseUrl}${path}`;
};

export type PositionSkillRequirement = {
  id: string;
  taxonomy_skill_id: string;
  skill_name?: string;
  importance_level: number;
  required_proficiency: number;
  category_name?: string;
  subcategory_name?: string;
  group_name?: string;
};

type Props = {
  positionId: string;
  positionTitle: string;
  onClose: () => void;
};

export function PositionRequirementsEditor({ positionId, positionTitle, onClose }: Props) {
  const queryClient = useQueryClient();
  const [showSkillPicker, setShowSkillPicker] = useState(false);
  const [editingRequirement, setEditingRequirement] = useState<PositionSkillRequirement | null>(null);

  // Fetch requirements
  const { data, isLoading, error } = useQuery<{ success: boolean; data: PositionSkillRequirement[] }, Error>({
    queryKey: ['position-requirements', positionId],
    queryFn: async () => {
      const res = await fetch(getApiUrl(`/api/skills/position-requirements?positionId=${positionId}&includeHierarchy=true`));
      if (!res.ok) throw new Error('Failed to fetch requirements');
      return res.json();
    },
  });

  // Remove requirement
  const removeMutation = useMutation({
    mutationFn: async (requirementId: string) => {
      const res = await fetch(getApiUrl(`/api/skills/position-requirements?requirementId=${requirementId}`), { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to remove requirement');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['position-requirements', positionId] });
      toast.success('Requirement removed');
    },
    onError: (err: any) => toast.error(err.message),
  });

  // Add requirement
  const addMutation = useMutation({
    mutationFn: async (skill: { taxonomySkillId: string; importanceLevel: number; requiredProficiency: number }) => {
      const res = await fetch(getApiUrl('/api/skills/position-requirements'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          positionId,
          taxonomySkillId: skill.taxonomySkillId,
          importanceLevel: skill.importanceLevel,
          requiredProficiency: skill.requiredProficiency,
        }),
      });
      if (!res.ok) throw new Error('Failed to add requirement');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['position-requirements', positionId] });
      toast.success('Requirement added');
    },
    onError: (err: any) => toast.error(err.message),
  });

  // Handler for adding a skill from picker
  const handleAddSkill = (skill: { id: string; name: string }) => {
    addMutation.mutate({ taxonomySkillId: skill.id, importanceLevel: 3, requiredProficiency: 3 });
    setShowSkillPicker(false);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Requirements for {positionTitle}</DialogTitle>
        </DialogHeader>
        <div className="mb-4 flex gap-2">
          <Button onClick={() => setShowSkillPicker(true)} size="sm">Add Skill</Button>
          <AISkillSuggestButton positionTitle={positionTitle} onSuggest={() => {}} />
        </div>
        {isLoading && <div>Loading...</div>}
        {error && <div className="text-red-500">{error.message}</div>}
        {data?.data && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Skill</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Importance</TableHead>
                <TableHead>Proficiency</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data.map((req) => (
                <TableRow key={req.id}>
                  <TableCell>{req.skill_name}</TableCell>
                  <TableCell>{req.category_name}</TableCell>
                  <TableCell>{req.importance_level}</TableCell>
                  <TableCell>{req.required_proficiency}</TableCell>
                  <TableCell>
                    <Button variant="destructive" size="sm" onClick={() => removeMutation.mutate(req.id)} disabled={removeMutation.isPending}>Remove</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>Close</Button>
        </DialogFooter>
        {showSkillPicker && (
          <TaxonomySkillPicker
            open={showSkillPicker}
            onSelect={handleAddSkill}
            onClose={() => setShowSkillPicker(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
} 