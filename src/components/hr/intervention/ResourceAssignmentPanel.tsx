import React, { useState } from '@/lib/react-helpers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ExternalLinkIcon } from '@/components/ui/custom-icons';
import { ResourceAssignment } from '@/types/intervention.types';

// Extend ResourceAssignment interface for UI functionality
interface ResourceAssignmentExtended extends ResourceAssignment {
  isRequired?: boolean; // Optional property for UI
}

// Available resource mock data
const availableResources = [
  {
    id: 'res-1',
    title: 'Introduction to Learning Fundamentals',
    type: 'document',
    description: 'A comprehensive guide to effective learning strategies.',
    url: 'https://example.com/resources/learning-fundamentals'
  },
  {
    id: 'res-2',
    title: 'Visual Learning Techniques',
    type: 'video',
    description: 'Video tutorial on visual learning techniques for complex concepts.',
    url: 'https://example.com/resources/visual-learning'
  },
  {
    id: 'res-3',
    title: 'Practice Exercises - Basic',
    type: 'quiz',
    description: 'Beginner level practice exercises to reinforce learning.',
    url: 'https://example.com/resources/exercises/basic'
  },
  {
    id: 'res-4',
    title: 'Advanced Concepts Explained',
    type: 'document',
    description: 'Detailed explanation of advanced concepts with examples.',
    url: 'https://example.com/resources/advanced-concepts'
  },
  {
    id: 'res-5',
    title: 'Interactive Learning Module',
    type: 'course',
    description: 'Fully interactive module with hands-on exercises.',
    url: 'https://example.com/resources/interactive-module'
  }
];

interface ResourceAssignmentPanelProps {
  initialResources?: ResourceAssignment[];
  onSave: (resources: ResourceAssignment[]) => void;
  onCancel: () => void;
  showHeader?: boolean;
}

/**
 * ResourceAssignmentPanel Component
 * 
 * A panel for HR to assign additional resources to employees as part of interventions
 */
const ResourceAssignmentPanel: React.FC<ResourceAssignmentPanelProps> = ({
  initialResources = [],
  onSave,
  onCancel,
  showHeader = true
}) => {
  // State for selected resources
  const [selectedResources, setSelectedResources] = useState<ResourceAssignmentExtended[]>(
    initialResources.map(r => ({ ...r, isRequired: true }))
  );
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // Filter resources based on type and search term
  const filteredResources = availableResources.filter(resource => {
    const matchesType = filterType === 'all' || resource.type === filterType;
    const matchesSearch = resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          resource.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });
  
  // Check if a resource is already selected
  const isResourceSelected = (resourceId: string) => {
    return selectedResources.some(r => r.resourceId === resourceId);
  };
  
  // Add resource to selection
  const addResource = (resource: any) => {
    if (isResourceSelected(resource.id)) return;
    
    const newResource: ResourceAssignmentExtended = {
      resourceId: resource.id,
      resourceType: resource.type,
      resourceName: resource.title,
      resourceUrl: resource.url,
      assignmentReason: '',
      isRequired: true
    };
    
    setSelectedResources([...selectedResources, newResource]);
  };
  
  // Remove resource from selection
  const removeResource = (resourceId: string) => {
    setSelectedResources(selectedResources.filter(r => r.resourceId !== resourceId));
  };
  
  // Update resource with new values
  const updateResource = (resourceId: string, updates: Partial<ResourceAssignmentExtended>) => {
    setSelectedResources(selectedResources.map(r => 
      r.resourceId === resourceId ? { ...r, ...updates } : r
    ));
  };
  
  // Handle save button click
  const handleSave = () => {
    // Convert back to standard ResourceAssignment by removing UI-specific properties
    const standardResources: ResourceAssignment[] = selectedResources
      .filter(r => r.assignmentReason) // Only include resources with a reason
      .map(({ resourceId, resourceType, resourceName, resourceUrl, assignmentReason }) => ({
        resourceId,
        resourceType,
        resourceName,
        resourceUrl,
        assignmentReason
      }));
    
    onSave(standardResources);
  };
  
  // Generate counts for each resource type
  const typeCounts = availableResources.reduce((counts, resource) => {
    counts[resource.type] = (counts[resource.type] || 0) + 1;
    return counts;
  }, {} as Record<string, number>);
  
  return (
    <Card className="w-full">
      {showHeader && (
        <CardHeader>
          <CardTitle>Assign Additional Resources</CardTitle>
          <CardDescription>
            Provide supplementary learning materials to help the employee improve
          </CardDescription>
        </CardHeader>
      )}
      
      <CardContent className="space-y-6">
        {/* Resource Browser */}
        <div className="border rounded-md p-4 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Resource Library</h3>
            
            <div className="flex items-center space-x-2">
              <Input
                placeholder="Search resources..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-60"
              />
            </div>
          </div>
          
          {/* Filter Tabs */}
          <div className="flex space-x-2 overflow-x-auto pb-2">
            <Badge
              variant={filterType === 'all' ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setFilterType('all')}
            >
              All ({availableResources.length})
            </Badge>
            {Object.entries(typeCounts).map(([type, count]) => (
              <Badge
                key={type}
                variant={filterType === type ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setFilterType(type)}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)} ({count})
              </Badge>
            ))}
          </div>
          
          {/* Resource List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredResources.map(resource => (
              <div
                key={resource.id}
                className={`border rounded-md p-3 ${
                  isResourceSelected(resource.id) ? 'bg-gray-50 border-primary' : ''
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">{resource.title}</h4>
                    <p className="text-sm text-gray-500">{resource.description}</p>
                    <div className="mt-1">
                      <Badge variant="outline" className="text-xs">
                        {resource.type}
                      </Badge>
                    </div>
                  </div>
                  
                  <Button
                    variant={isResourceSelected(resource.id) ? "destructive" : "default"}
                    size="sm"
                    onClick={() => isResourceSelected(resource.id) ? 
                      removeResource(resource.id) : 
                      addResource(resource)
                    }
                  >
                    {isResourceSelected(resource.id) ? "Remove" : "Add"}
                  </Button>
                </div>
              </div>
            ))}
            
            {filteredResources.length === 0 && (
              <div className="col-span-2 text-center py-10 text-gray-500">
                No resources found matching your filters.
              </div>
            )}
          </div>
        </div>
        
        {/* Selected Resources */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Selected Resources ({selectedResources.length})</h3>
          
          {selectedResources.length === 0 ? (
            <div className="text-center py-10 border rounded-md text-gray-500">
              No resources selected. Add resources from the library above.
            </div>
          ) : (
            <div className="space-y-4">
              {selectedResources.map(resource => {
                const resourceDetails = availableResources.find(r => r.id === resource.resourceId);
                
                return (
                  <div key={resource.resourceId} className="border rounded-md p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{resource.resourceName}</h4>
                        {resourceDetails && (
                          <p className="text-sm text-gray-500">{resourceDetails.description}</p>
                        )}
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeResource(resource.resourceId)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label htmlFor={`reason-${resource.resourceId}`}>Reason for Assignment</Label>
                        <Textarea
                          id={`reason-${resource.resourceId}`}
                          placeholder="Why is this resource being assigned?"
                          value={resource.assignmentReason}
                          onChange={(e) => updateResource(resource.resourceId, { assignmentReason: e.target.value })}
                          rows={2}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`required-${resource.resourceId}`}
                            checked={resource.isRequired}
                            onCheckedChange={(checked) => 
                              updateResource(resource.resourceId, { isRequired: !!checked })
                            }
                          />
                          <Label htmlFor={`required-${resource.resourceId}`}>
                            Required Resource
                          </Label>
                        </div>
                        
                        {resource.resourceUrl && (
                          <div className="mt-2">
                            <a
                              href={resource.resourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:underline flex items-center"
                            >
                              View Resource <ExternalLinkIcon className="h-3 w-3 ml-1" />
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        {/* Action Buttons */}
        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          
          <Button 
            onClick={handleSave}
            disabled={selectedResources.length === 0 || selectedResources.some(r => !r.assignmentReason)}
          >
            Save Assignments
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ResourceAssignmentPanel; 