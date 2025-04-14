
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface CourseContentSectionProps {
  title: string;
  content: string;
}

const CourseContentSection: React.FC<CourseContentSectionProps> = ({
  title,
  content
}) => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div 
          className="prose max-w-none" 
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </CardContent>
    </Card>
  );
};

export default CourseContentSection;
