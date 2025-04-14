import React from 'react';

/**
 * Custom hook to extract text content and metadata from HTML strings
 * @param htmlString - The HTML string to process
 * @returns An object containing the clean HTML and extracted title
 */
export function useHtmlContent(htmlString: string) {
  const [processedContent, setProcessedContent] = React.useState({
    html: htmlString,
    title: '',
    hasFormatting: false
  });

  React.useEffect(() => {
    if (!htmlString) {
      setProcessedContent({
        html: '',
        title: '',
        hasFormatting: false
      });
      return;
    }

    try {
      // Check if the content contains HTML tags
      const hasHtmlTags = /<\/?[a-z][\s\S]*>/i.test(htmlString);
      
      // Extract title from h1 or h2 if present
      let title = '';
      const titleMatch = htmlString.match(/<h[1-2][^>]*>(.*?)<\/h[1-2]>/i);
      if (titleMatch && titleMatch[1]) {
        title = titleMatch[1].replace(/<\/?[^>]+(>|$)/g, '').trim();
      }

      // For plain text content, wrap it in proper HTML
      let processedHtml = htmlString;
      if (!hasHtmlTags) {
        processedHtml = `<div class="prose max-w-none"><p>${htmlString}</p></div>`;
      }

      setProcessedContent({
        html: processedHtml,
        title: title,
        hasFormatting: hasHtmlTags
      });
    } catch (error) {
      console.error('Error processing HTML content:', error);
      // Return original string if processing fails
      setProcessedContent({
        html: htmlString,
        title: '',
        hasFormatting: false
      });
    }
  }, [htmlString]);

  return processedContent;
} 