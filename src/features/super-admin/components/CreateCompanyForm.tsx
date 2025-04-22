import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useHRAuth } from '@/contexts/HRAuthContext'; // For getting JWT
import { Database } from '@/types/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

// Zod Schema for form validation
const createCompanyFormSchema = z.object({
  name: z.string().min(2, {
    message: 'Company name must be at least 2 characters.',
  }),
});

type CreateCompanyFormValues = z.infer<typeof createCompanyFormSchema>;

interface CreateCompanyFormProps {
  onSuccess: () => void; // Callback on successful creation
}

export const CreateCompanyForm: React.FC<CreateCompanyFormProps> = ({ 
  onSuccess 
}: CreateCompanyFormProps) => {
  const supabase = useSupabaseClient<Database>();
  const { session } = useHRAuth();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm({
    resolver: zodResolver(createCompanyFormSchema),
    defaultValues: {
      name: '',
    },
  });

  const onSubmit = async (values: CreateCompanyFormValues) => {
    setIsSubmitting(true);

    if (!session?.access_token) {
      toast({ title: "Authentication Error", description: "Cannot get user session.", variant: "destructive" });
      setIsSubmitting(false);
      return;
    }

    try {
      console.log('Invoking create-company function with:', values);

      // Call the 'create-company' Edge Function
      const { data, error } = await supabase.functions.invoke('create-company', {
          body: values, // contains { name: string }
          headers: {
              Authorization: `Bearer ${session.access_token}`
          }
      });

      if (error) {
          // Handle potential function-specific errors
          console.error('Supabase function invocation error:', error);
          let errorMessage = 'Could not create the company. Please try again.';
          if (error instanceof Error) {
              try {
                  const errorBody = JSON.parse(error.message);
                  errorMessage = errorBody.error || errorMessage;
              } catch (_) {
                  errorMessage = error.message || errorMessage;
              }
          }
          throw new Error(errorMessage);
      }

      console.log('Create company success:', data);
      toast({
        title: "Company Created",
        description: data?.message || `Company "${values.name}" has been successfully created.`,
      });
      form.reset();
      onSuccess(); // Call the success callback (closes dialog, refreshes list)

    } catch (error: any) {
      console.error("Error creating company:", error);
      toast({
        title: "Failed to Create Company",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      {/* The actual <form> tag is needed here */}
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }: { field: any }) => (
            <FormItem>
              <FormLabel>Company Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter company name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* Add DialogFooter or buttons directly here */}
        <div className="flex justify-end space-x-2 pt-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                 <>
                   <LoadingSpinner className="mr-2 h-4 w-4 animate-spin" />
                   Saving...
                 </>
              ) : (
                'Save Company'
              )}
            </Button>
        </div>
      </form>
    </Form>
  );
}; 