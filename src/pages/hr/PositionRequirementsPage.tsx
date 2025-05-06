import useState from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PositionRequirementsEditor } from '../../components/hr/PositionRequirementsEditor';

type PositionWithRequirementCount = {
  id: string;
  title: string;
  department_id: string;
  department_name: string;
  requirement_count: number;
};

export default function PositionRequirementsPage() {
  const [selectedPosition, setSelectedPosition] = useState<PositionWithRequirementCount | null>(null);

  const { data, isLoading, error } = useQuery<{ success: boolean; data: PositionWithRequirementCount[] }, Error>({
    queryKey: ['positions-with-requirement-counts'],
    queryFn: async () => {
      const res = await fetch('/api/hr/positions-with-requirement-counts');
      if (!res.ok) throw new Error('Failed to fetch positions');
      return res.json();
    },
  });

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Position Requirements</h1>
      {isLoading && <div>Loading...</div>}
      {error && <div className="text-red-500">{error.message}</div>}
      {data?.data && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Position Title</TableHead>
              <TableHead>Department</TableHead>
              <TableHead># Requirements</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.data.map((pos) => (
              <TableRow key={pos.id}>
                <TableCell>{pos.title}</TableCell>
                <TableCell>{pos.department_name}</TableCell>
                <TableCell>{pos.requirement_count}</TableCell>
                <TableCell>
                  <Button onClick={() => setSelectedPosition(pos)} size="sm">Edit Requirements</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      {selectedPosition && (
        <PositionRequirementsEditor
          positionId={selectedPosition.id}
          positionTitle={selectedPosition.title}
          onClose={() => setSelectedPosition(null)}
        />
      )}
    </div>
  );
} 