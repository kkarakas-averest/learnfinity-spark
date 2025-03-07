import React from "@/lib/react-helpers";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";

const TableStructureButton: React.FC = () => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [structure, setStructure] = React.useState<any[]>([]);
  const [showStructure, setShowStructure] = React.useState(false);

  const fetchTableStructure = async () => {
    setIsLoading(true);
    try {
      // Fetch the notifications table structure
      const { data, error } = await supabase.rpc('get_table_structure', {
        table_name: 'notifications'
      });
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        setStructure(data);
        setShowStructure(true);
        toast({
          title: "Success!",
          description: "Retrieved notifications table structure.",
        });
      } else {
        throw new Error('No data returned');
      }
    } catch (error) {
      console.error("Error fetching table structure:", error);
      
      // Try a fallback approach with a direct SQL query
      try {
        const { data, error: sqlError } = await supabase.from('notifications').select('*').limit(1);
        
        if (sqlError) throw sqlError;
        
        if (data && data.length > 0) {
          // Extract column names from the first row
          const columns = Object.keys(data[0]).map(col => ({ column_name: col }));
          setStructure(columns);
          setShowStructure(true);
          toast({
            title: "Success!",
            description: "Retrieved notifications table columns from sample data.",
          });
        } else {
          toast({
            title: "Unable to determine structure",
            description: "Could not fetch table structure or sample data.",
            variant: "destructive",
          });
        }
      } catch (fallbackError) {
        toast({
          title: "Error",
          description: `Failed to fetch table structure: ${fallbackError.message || error.message}`,
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-4">
      <Button 
        onClick={fetchTableStructure} 
        disabled={isLoading}
        variant="outline"
        size="sm"
      >
        {isLoading ? "Fetching..." : "Check Table Structure"}
      </Button>
      
      {showStructure && structure.length > 0 && (
        <div className="mt-2 p-3 bg-gray-100 rounded-md text-sm">
          <p className="font-medium mb-2">Notifications Table Columns:</p>
          <ul className="list-disc pl-5">
            {structure.map((col, index) => (
              <li key={index}>{col.column_name}</li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-gray-600">
            You can use these column names in your SQL queries. Make sure to only include columns that exist in the table.
          </p>
        </div>
      )}
    </div>
  );
};

export default TableStructureButton; 