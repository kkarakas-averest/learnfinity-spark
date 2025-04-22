import React from 'react';
import useState from 'react';
import useEffect from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react'; // Or useHRAuth if user info needed
import { Database } from '@/types/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { toast } from '@/components/ui/use-toast';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useHRAuth } from '@/contexts/HRAuthContext'; // Import useHRAuth

// Types
type Company = Database['public']['Tables']['companies']['Row'];
type InviteRole = 'H&R' | 'L&D';

// Zod Schema for form validation - replace enum with string validation
const inviteFormSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  company_id: z.string().uuid({ message: 'Please select a valid company.' }),
  role: z.string().refine((val: string) => ['H&R', 'L&D'].includes(val), {
    message: "Role must be either 'H&R' or 'L&D'"
  })
});

type InviteFormValues = {
  email: string;
  company_id: string;
  role: InviteRole;
}; // Use explicit type definition instead of z.infer

export const InviteUserForm: React.FC = () => {
  const supabase = useSupabaseClient<Database>();
  const { session } = useHRAuth(); // Get session from HRAuth context
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Fetch companies for the dropdown
  useEffect(() => {
    const fetchCompanies = async () => {
      setIsLoadingCompanies(true);
      // Reusing fetch logic - consider extracting to a hook if used elsewhere
      try {
        const { data, error } = await supabase
          .from('companies')
          .select('id, name')
          .order('name', { ascending: true });

        if (error) throw error;
        setCompanies(data || []);
      } catch (error: any) {
        console.error('Error fetching companies for invite form:', error);
        toast({
          title: 'Error Loading Companies',
          description: 'Could not fetch the list of companies. Please try again.',
          variant: 'destructive',
        });
        setCompanies([]); // Ensure it's an empty array on error
      } finally {
        setIsLoadingCompanies(false);
      }
    };
    fetchCompanies();
  }, [supabase]);

  const form = useForm({
    resolver: zodResolver(inviteFormSchema),
    defaultValues: {
      email: '',
      company_id: '',
      role: undefined, // Start with no role selected
    },
  });

  const onSubmit = async (values: InviteFormValues) => {
    setIsSubmitting(true);

    if (!session?.access_token) {
      toast({
        title: "Authentication Error",
        description: "Could not get authentication token. Please log in again.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    try {
      console.log('Invoking create-invite function with:', values);
      const { data, error } = await supabase.functions.invoke('create-invite', {
          body: values,
          headers: {
              Authorization: `Bearer ${session.access_token}`
          }
      });

      if (error) {
          // Handle potential function-specific errors (e.g., from Deno response)
          console.error('Supabase function invocation error:', error);
          // Attempt to parse error message if possible
          let errorMessage = 'Could not send the invitation. Please try again.';
          if (error instanceof Error) {
              try {
                  // Functions errors often come back with a JSON body
                  const errorBody = JSON.parse(error.message);
                  errorMessage = errorBody.error || errorMessage;
              } catch (_) {
                  errorMessage = error.message || errorMessage;
              }
          }
          throw new Error(errorMessage);
      }

      // Assuming the function returns { message: "..." } on success
      console.log('Invite function success:', data);
      toast({
          title: "Invite Sent",
          description: data?.message || `Invitation successfully sent to ${values.email}.`,
      });
      form.reset(); // Reset form on success

    } catch (error: any) {
      console.error("Error submitting invite:", error);
      toast({
        title: "Invite Failed",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-2xl">
        <FormField
          control={form.control}
          name="email"
          render={({ field }: { field: any }) => (
            <FormItem>
              <FormLabel>User Email</FormLabel>
              <FormControl>
                <Input placeholder="user@example.com" {...field} />
              </FormControl>
              <FormDescription>
                The email address of the user you want to invite.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="company_id"
          render={({ field }: { field: any }) => (
            <FormItem>
              <FormLabel>Company</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={isLoadingCompanies || companies.length === 0}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={
                        isLoadingCompanies
                        ? "Loading companies..."
                        : companies.length === 0
                        ? "No companies available"
                        : "Select a company"
                    } />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {!isLoadingCompanies && companies.map((company: Company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                The company the user will be associated with.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="role"
          render={({ field }: { field: any }) => (
            <FormItem>
              <FormLabel>Role</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="H&R">H&R</SelectItem>
                  <SelectItem value="L&D">L&D</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                The initial role the user will have in the company.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting || isLoadingCompanies}>
          {isSubmitting ? (
             <>
               <LoadingSpinner className="mr-2 h-4 w-4 animate-spin" />
               Sending Invite...
             </>
          ) : (
            'Send Invite'
          )}
        </Button>
      </form>
    </Form>
  );
}; 