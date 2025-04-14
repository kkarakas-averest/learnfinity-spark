import React from 'react';

interface HtmlContentRendererProps {
  content: string;
  className?: string;
}

/**
 * Component to safely render HTML content
 * Use this component when displaying HTML content from the server
 */
const HtmlContentRenderer: React.FC<HtmlContentRendererProps> = ({ 
  content, 
  className = "prose max-w-none" 
}) => {
  // Check if content is already HTML or needs to be wrapped
  const isHtml = React.useMemo(() => {
    return /<\/?[a-z][\s\S]*>/i.test(content);
  }, [content]);

  // Prepare the content
  const htmlContent = React.useMemo(() => {
    if (!content) return '';
    
    // If it's not HTML, wrap it in paragraph tags
    if (!isHtml) {
      return `<p>${content}</p>`;
    }
    
    return content;
  }, [content, isHtml]);

  return (
    <div 
      className={className}
      dangerouslySetInnerHTML={{ __html: htmlContent }} 
    />
  );
};

export default HtmlContentRenderer; 