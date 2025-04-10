/**
 * PDF Extractor Service
 * 
 * A client-side PDF text extraction service using PDF.js for high-quality text extraction.
 */
// Import PDF.js only in browser environment
// This uses dynamic imports to avoid require() calls during SSR/build time
let PDFJS: typeof import('pdfjs-dist');

// Initialize PDF.js only in browser environment
const initPdfJs = async (): Promise<typeof import('pdfjs-dist')> => {
  if (typeof window === 'undefined') {
    throw new Error('PDF.js can only be initialized in browser environment');
  }
  
  if (!PDFJS) {
    // Dynamically import PDF.js
    PDFJS = await import('pdfjs-dist');
    
    // Set the worker source to a CDN URL
    const workerUrl = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.1.91/pdf.worker.min.js';
    PDFJS.GlobalWorkerOptions.workerSrc = workerUrl;
  }
  
  return PDFJS;
};

/**
 * Result of PDF text extraction
 */
export interface PDFExtractionResult {
  success: boolean;
  text: string;
  metadata?: {
    pageCount?: number;
    title?: string;
    author?: string;
    error?: string;
    filename?: string;
  };
}

/**
 * Extract text from a PDF URL using PDF.js
 * 
 * @param pdfUrl URL of the PDF to extract text from
 * @returns A promise with the extracted text and metadata
 */
export async function extractTextFromPdf(pdfUrl: string): Promise<PDFExtractionResult> {
  console.log(`Extracting text from PDF URL using PDF.js: ${pdfUrl}`);
  
  try {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      throw new Error('PDF extraction is only available in browser environment');
    }
    
    // Initialize PDF.js
    const pdfjs = await initPdfJs();
    
    // Extract filename from URL (for debugging)
    const filename = pdfUrl.split('/').pop() || 'unknown.pdf';
    
    // Fetch the PDF as ArrayBuffer
    const response = await fetch(pdfUrl, {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`);
    }
    
    // Get PDF as array buffer
    const arrayBuffer = await response.arrayBuffer();
    console.log(`PDF fetched, size: ${arrayBuffer.byteLength} bytes`);
    
    // Use PDF.js to load the document
    const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
    const pdfDocument = await loadingTask.promise;
    
    // Get document metadata
    const metadata = await pdfDocument.getMetadata();
    console.log('PDF metadata:', metadata.info);
    
    // Extract text from each page and combine
    const pageCount = pdfDocument.numPages;
    console.log(`PDF has ${pageCount} pages. Starting text extraction...`);
    
    let fullText = '';
    for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
      const page = await pdfDocument.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      // Extract text from the text content items
      const pageText = textContent.items.map(item => {
        return 'str' in item ? item.str : '';
      }).join(' ');
      
      fullText += pageText + '\n\n';
      page.cleanup(); // Clean up page resources
    }
    
    // Clean the text
    const cleanedText = cleanPdfText(fullText);
    console.log(`Successfully extracted ${cleanedText.length} characters from PDF`);
    
    // Safely access metadata properties
    const metadataInfo = metadata.info as Record<string, any>;
    
    return {
      success: true,
      text: cleanedText,
      metadata: {
        pageCount,
        title: metadataInfo?.Title || '',
        author: metadataInfo?.Author || '',
        filename
      }
    };
  } catch (error) {
    console.error('Error extracting PDF text:', error);
    
    return {
      success: false,
      text: '',
      metadata: {
        error: error instanceof Error ? error.message : String(error)
      }
    };
  }
}

/**
 * Clean and normalize PDF text content
 * 
 * @param text Raw text extracted from PDF
 * @returns Cleaned text
 */
function cleanPdfText(text: string): string {
  return text
    .replace(/\r\n/g, '\n')            // Normalize line breaks
    .replace(/\n{3,}/g, '\n\n')        // Replace 3+ newlines with just 2
    .replace(/\s{2,}/g, ' ')           // Collapse multiple spaces/tabs into single space
    .replace(/[^\x20-\x7E\n]/g, '')    // Remove non-printable ASCII chars (excluding newline)
    .trim();
}
