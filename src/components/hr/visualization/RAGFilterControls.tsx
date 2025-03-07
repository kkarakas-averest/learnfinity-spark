import React from '@/lib/react-helpers';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, CheckCircle, AlertCircle, Filter } from 'lucide-react';
import { SortAscendingIcon, SortDescendingIcon } from '@/components/ui/custom-icons';
import { RAGStatus } from '@/types/hr.types';

export type RAGSortOption = 'status-asc' | 'status-desc' | 'name-asc' | 'name-desc' | 'last-update';
export type RAGFilterOption = RAGStatus | 'all';

interface RAGFilterControlsProps {
  selectedFilter: RAGFilterOption;
  sortOption: RAGSortOption;
  onFilterChange: (filter: RAGFilterOption) => void;
  onSortChange: (sort: RAGSortOption) => void;
  counts?: {
    green: number;
    amber: number;
    red: number;
    total: number;
  };
  compact?: boolean;
}

/**
 * RAGFilterControls Component
 * 
 * Provides UI controls for filtering and sorting employees by RAG status
 */
const RAGFilterControls: React.FC<RAGFilterControlsProps> = ({
  selectedFilter,
  sortOption,
  onFilterChange,
  onSortChange,
  counts = { green: 0, amber: 0, red: 0, total: 0 },
  compact = false,
}) => {
  // Get color class for RAG status
  const getStatusColorClass = (status: RAGStatus | 'all'): string => {
    switch (status) {
      case 'red': return 'bg-destructive text-destructive-foreground';
      case 'amber': return 'bg-yellow-500 text-white';
      case 'green': return 'bg-green-500 text-white';
      case 'all': return 'bg-gray-200 text-gray-700';
    }
  };
  
  // Get icon for RAG status
  const getStatusIcon = (status: RAGStatus | 'all'): JSX.Element | null => {
    switch (status) {
      case 'red': return <AlertCircle className="h-3 w-3 mr-1" />;
      case 'amber': return <AlertTriangle className="h-3 w-3 mr-1" />;
      case 'green': return <CheckCircle className="h-3 w-3 mr-1" />;
      case 'all': return <Filter className="h-3 w-3 mr-1" />;
    }
  };
  
  return (
    <Card className={compact ? 'p-0 shadow-none border-0' : ''}>
      <CardContent className={compact ? 'p-0' : 'pt-6'}>
        <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4 items-start">
          {/* Filter buttons */}
          <div className="space-y-2 w-full sm:w-auto">
            <div className="text-sm font-medium mb-1">Filter by Status</div>
            <div className="flex flex-wrap gap-2">
              <Badge 
                className={`cursor-pointer capitalize flex items-center ${
                  selectedFilter === 'all' ? getStatusColorClass('all') : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
                onClick={() => onFilterChange('all')}
              >
                {getStatusIcon('all')}
                All ({counts.total})
              </Badge>
              
              <Badge 
                className={`cursor-pointer capitalize flex items-center ${
                  selectedFilter === 'green' ? getStatusColorClass('green') : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
                onClick={() => onFilterChange('green')}
              >
                {getStatusIcon('green')}
                Green ({counts.green})
              </Badge>
              
              <Badge 
                className={`cursor-pointer capitalize flex items-center ${
                  selectedFilter === 'amber' ? getStatusColorClass('amber') : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
                onClick={() => onFilterChange('amber')}
              >
                {getStatusIcon('amber')}
                Amber ({counts.amber})
              </Badge>
              
              <Badge 
                className={`cursor-pointer capitalize flex items-center ${
                  selectedFilter === 'red' ? getStatusColorClass('red') : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
                onClick={() => onFilterChange('red')}
              >
                {getStatusIcon('red')}
                Red ({counts.red})
              </Badge>
            </div>
          </div>
          
          {/* Sort dropdown */}
          <div className="w-full sm:w-64">
            <div className="text-sm font-medium mb-1">Sort by</div>
            <Select value={sortOption} onValueChange={(value) => onSortChange(value as RAGSortOption)}>
              <SelectTrigger>
                <SelectValue placeholder="Select sorting option" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="status-desc">
                  <div className="flex items-center">
                    <SortDescendingIcon className="h-4 w-4 mr-2" />
                    <span>RAG Status (Critical First)</span>
                  </div>
                </SelectItem>
                <SelectItem value="status-asc">
                  <div className="flex items-center">
                    <SortAscendingIcon className="h-4 w-4 mr-2" />
                    <span>RAG Status (Good First)</span>
                  </div>
                </SelectItem>
                <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                <SelectItem value="last-update">Most Recent Update</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RAGFilterControls; 