import { useState } from '@/lib/react-helpers';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TaxonomySkillPicker } from './TaxonomySkillPicker';
import { AISkillSuggestButton } from './AISkillSuggestButton';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

// Helper function to get API URL
const getApiUrl = (path: string) => {
  return path;
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
  departmentId?: string;
  departmentName?: string;
  onClose: () => void;
};

export function PositionRequirementsEditor({ 
  positionId, 
  positionTitle,
  departmentId,
  departmentName, 
  onClose 
}: Props) {
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

  // Handler for AI suggestions applied
  const handleSuggestionsApplied = (appliedCount: number) => {
    queryClient.invalidateQueries({ queryKey: ['position-requirements', positionId] });
  };

  // Count by category
  const categoryCount = data?.data?.reduce((acc, req) => {
    const category = req.category_name || 'Uncategorized';
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Requirements for {positionTitle}</DialogTitle>
        </DialogHeader>
        
        <div className="mb-4 flex justify-between items-center">
          <div className="flex gap-2">
            <Button onClick={() => setShowSkillPicker(true)} size="sm">Add Skill</Button>
            <AISkillSuggestButton 
              positionId={positionId} 
              positionTitle={positionTitle}
              departmentId={departmentId}
              departmentName={departmentName}
              onSuggestionsApplied={handleSuggestionsApplied}
            />
          </div>
          
          <div className="text-sm text-muted-foreground">
            {data?.data?.length} skill requirements
          </div>
        </div>

        {/* Category summary */}
        {data?.data && data.data.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {Object.entries(categoryCount).map(([category, count]) => (
              <Badge key={category} variant="outline">
                {category}: {count}
              </Badge>
            ))}
          </div>
        )}
        
        {isLoading && <div>Loading...</div>}
        {error && <div className="text-red-500">{error.message}</div>}
        {data?.data && (
          <div className="max-h-[400px] overflow-y-auto">
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
          </div>
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