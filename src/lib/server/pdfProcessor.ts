import fetch from 'node-fetch';
import * as pdfParse from 'pdf-parse';

/**
 * Options for PDF text extraction
 */
interface PDFProcessingOptions {
  maxPages?: number;
  includePageNumbers?: boolean;
}

/**
 * Result of PDF text extraction
 */
interface PDFProcessingResult {
  text: string;
  numPages: number;
  metadata: {
    info?: any;
    metadata?: any;
    error?: string;
  };
}

/**
 * Downloads a PDF from a URL and extracts its text content
 * 
 * @param url URL of the PDF file
 * @param options Processing options
 * @returns The extracted text and metadata
 */
export async function extractTextFromPdfUrl(url: string, options: PDFProcessingOptions = {}): Promise<PDFProcessingResult> {
  try {
    // Download the PDF file
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to download PDF: ${response.status} ${response.statusText}`);
    }
    
    // Get the buffer from the response
    const buffer = await response.buffer();
    
    // Process the PDF
    return await processPdfBuffer(buffer, options);
  } catch (error) {
    console.error('Error extracting text from PDF URL:', error);
    return {
      text: '',
      numPages: 0,
      metadata: {
        error: error instanceof Error ? error.message : String(error)
      }
    };
  }
}

/**
 * Processes a PDF buffer to extract text content
 * 
 * @param buffer PDF file as a buffer
 * @param options Processing options
 * @returns The extracted text and metadata
 */
export async function processPdfBuffer(buffer: Buffer, options: PDFProcessingOptions = {}): Promise<PDFProcessingResult> {
  try {
    const { maxPages } = options;
    
    // Configure PDF parsing options
    const pdfOptions = {
      max: maxPages,
    };
    
    // Parse the PDF
    const result = await pdfParse(buffer, pdfOptions);
    
    // Format the result
    return {
      text: result.text,
      numPages: result.numpages,
      metadata: {
        info: result.info,
        metadata: result.metadata
      }
    };
  } catch (error) {
    console.error('Error processing PDF buffer:', error);
    return {
      text: '',
      numPages: 0,
      metadata: {
        error: error instanceof Error ? error.message : String(error)
      }
    };
  }
}

/**
 * Extracts a summary of key information from a PDF
 * 
 * @param pdfContent The extracted PDF text content
 * @returns A summary of key information from the PDF
 */
export function extractKeyInformation(pdfContent: string): string {
  // Remove excess whitespace and normalize line breaks
  const cleanedContent = pdfContent
    .replace(/\r\n/g, '\n')
    .replace(/\s+/g, ' ')
    .trim();
  
  // Return the processed content, truncating if it's extremely long
  // (most LLMs have token limits)
  const maxLength = 100000; // Approximately 25k tokens for most models
  if (cleanedContent.length > maxLength) {
    return cleanedContent.substring(0, maxLength) + 
      '\n\n[Content truncated due to length...]';
  }
  
  return cleanedContent;
} 