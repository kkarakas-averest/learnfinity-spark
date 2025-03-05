import * as React from "react";
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Page header component with title, description, and optional back button
 * @param {Object} props - Component props
 * @param {string} props.title - Page title
 * @param {string} props.description - Page description
 * @param {Object} props.backButton - Back button configuration
 * @param {string} props.backButton.label - Back button label
 * @param {string} props.backButton.to - Back button destination path
 * @param {React.ReactNode} props.actions - Additional actions to display in the header
 */
export const PageHeader = ({ 
  title, 
  description, 
  backButton,
  actions
}) => {
  return (
    <div className="mb-8 space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          {backButton && (
            <Button 
              variant="ghost" 
              className="mb-2 p-0 h-auto text-muted-foreground hover:text-foreground hover:bg-transparent"
              asChild
            >
              <Link to={backButton.to} className="flex items-center gap-1">
                <ArrowLeft className="h-4 w-4" />
                {backButton.label || 'Back'}
              </Link>
            </Button>
          )}
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          {description && (
            <p className="text-lg text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

export default PageHeader; 