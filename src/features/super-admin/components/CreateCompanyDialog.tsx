import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { CreateCompanyForm } from '@/features/super-admin/components/CreateCompanyForm';

interface CreateCompanyDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateCompanyDialog({
  isOpen,
  setIsOpen,
  onSuccess
}: CreateCompanyDialogProps) {

  const handleSuccess = () => {
    onSuccess();
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Company</DialogTitle>
          <DialogDescription>
            Enter the details of the new company. Click save when you&apos;re done.
          </DialogDescription>
        </DialogHeader>
        <CreateCompanyForm onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  );
} 