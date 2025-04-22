import React from 'react';
import useState from 'react';
import useEffect from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { Database } from '@/types/supabase';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CreateCompanyDialog } from '../components/CreateCompanyDialog';

// Define the type for a company based on your Supabase schema
type Company = Database['public']['Tables']['companies']['Row'];

const ManageCompaniesPage: React.FC = () => {
  const supabase = useSupabaseClient<Database>();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState<boolean>(false);

  // Function to refetch companies (passed to dialog for refresh on success)
  const refetchCompanies = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('companies')
        .select('*')
        .order('name', { ascending: true });
      if (fetchError) throw fetchError;
      setCompanies(data || []);
    } catch (err: any) {
      console.error("Error refetching companies:", err);
      setError(err.message || 'Failed to refetch companies.');
      setCompanies([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    refetchCompanies();
  }, [supabase]);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">Manage Companies</h2>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
             Create Company
          </Button>
      </div>

      {isLoading && (
        <div className="flex justify-center items-center py-8">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {error && (
         <Alert variant="destructive" className="mb-4">
           <AlertTitle>Error</AlertTitle>
           <AlertDescription>{error}</AlertDescription>
         </Alert>
      )}

      {!isLoading && !error && (
          <div className="border rounded-md">
              <Table>
                  <TableCaption>A list of all registered companies.</TableCaption>
                  <TableHeader>
                      <TableRow>
                          <TableHead className="w-[100px]">ID</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Created At</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {companies.length === 0 ? (
                          <TableRow>
                              <TableCell colSpan={4} className="h-24 text-center">
                                  No companies found.
                              </TableCell>
                          </TableRow>
                      ) : (
                          companies.map((company: Company) => (
                              <TableRow key={company.id}>
                                  <TableCell className="font-medium truncate max-w-[100px]" title={company.id}>{company.id}</TableCell>
                                  <TableCell>{company.name}</TableCell>
                                  <TableCell>
                                      {company.created_at ? new Date(company.created_at).toLocaleDateString() : 'N/A'}
                                  </TableCell>
                                  <TableCell className="text-right">
                                      <DropdownMenu>
                                          <DropdownMenuTrigger asChild>
                                              <Button variant="ghost" className="h-8 w-8 p-0">
                                                  <span className="sr-only">Open menu</span>
                                                  <MoreHorizontal className="h-4 w-4" />
                                              </Button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent align="end">
                                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                              <DropdownMenuItem onClick={() => console.log('Edit clicked', company.id)}>
                                                  Edit
                                              </DropdownMenuItem>
                                              <DropdownMenuItem onClick={() => console.log('Delete clicked', company.id)} className="text-red-600 focus:text-red-600">
                                                  Delete
                                              </DropdownMenuItem>
                                          </DropdownMenuContent>
                                      </DropdownMenu>
                                  </TableCell>
                              </TableRow>
                          ))
                      )}
                  </TableBody>
              </Table>
          </div>
      )}

      <CreateCompanyDialog 
        isOpen={isCreateDialogOpen}
        setIsOpen={setIsCreateDialogOpen}
        onSuccess={refetchCompanies}
      />
    </div>
  );
};

export default ManageCompaniesPage; 