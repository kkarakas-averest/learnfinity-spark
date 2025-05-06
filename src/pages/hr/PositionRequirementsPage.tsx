import { useState } from '@/lib/react-helpers';
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

  const { data, isLoading, error } = useQuery<{ positions: PositionWithRequirementCount[] }, Error>({
    queryKey: ['positions-with-requirement-counts'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/hr/positions-with-requirement-counts');
        if (!res.ok) {
          console.error('API response error:', await res.text());
          throw new Error(`Failed to fetch positions: ${res.status}`);
        }
        return res.json();
      } catch (err) {
        console.error('Position requirements fetch error:', err);
        throw new Error('Failed to load positions data. See console for details.');
      }
    },
  });

  console.log('PositionRequirementsPage rendering:', { data, isLoading, error });

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Position Requirements</h1>
      {isLoading && <div>Loading...</div>}
      {error && (
        <div className="text-red-500 p-4 border border-red-300 rounded bg-red-50 mb-4">
          Error: {error.message}
        </div>
      )}
      {data?.positions && data.positions.length > 0 ? (
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
            {data.positions.map((pos) => (
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
      ) : !isLoading && !error ? (
        <div className="text-center p-8 text-gray-500">No positions found</div>
      ) : null}
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