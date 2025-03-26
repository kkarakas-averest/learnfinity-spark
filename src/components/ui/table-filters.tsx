
import React from 'react';

interface TableFilterControlsProps {
  children: React.ReactNode;
}

export const TableFilterControls: React.FC<TableFilterControlsProps> = ({ 
  children 
}) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 mb-4">
      {children}
    </div>
  );
};
