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
  console.log('----------- PDF PROCESSOR: EXTRACT FROM URL START -----------');
  console.log(`PDF URL: ${url}`);
  
  try {
    // Download the PDF file
    console.log('Downloading PDF file...');
    const startDownload = Date.now();
    const response = await fetch(url);
    const downloadTime = Date.now() - startDownload;
    console.log(`PDF download completed in ${downloadTime}ms`);
    
    if (!response.ok) {
      const error = `Failed to download PDF: ${response.status} ${response.statusText}`;
      console.error(error);
      console.log('Response headers:', response.headers);
      throw new Error(error);
    }
    
    // Get the buffer from the response
    console.log('Converting response to buffer...');
    const bufferStart = Date.now();
    const buffer = await response.buffer();
    const bufferTime = Date.now() - bufferStart;
    console.log(`PDF buffer created in ${bufferTime}ms, size: ${buffer.length} bytes`);
    
    // Process the PDF
    console.log('Processing PDF buffer...');
    const result = await processPdfBuffer(buffer, options);
    console.log(`PDF processing complete: ${result.text.length} characters extracted from ${result.numPages} pages`);
    console.log('----------- PDF PROCESSOR: EXTRACT FROM URL COMPLETE -----------');
    
    return result;
  } catch (error) {
    console.error('Error extracting text from PDF URL:', error);
    console.log('Error details:', error instanceof Error ? error.stack : String(error));
    console.log('----------- PDF PROCESSOR: EXTRACT FROM URL FAILED -----------');
    
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
  console.log('----------- PDF PROCESSOR: PROCESS BUFFER START -----------');
  console.log(`Buffer size: ${buffer.length} bytes`);
  
  try {
    const { maxPages } = options;
    console.log(`Processing options: maxPages=${maxPages || 'unlimited'}`);
    
    // Configure PDF parsing options
    const pdfOptions = {
      max: maxPages,
    };
    
    // Parse the PDF
    console.log('Parsing PDF with pdf-parse library...');
    const parseStart = Date.now();
    const result = await pdfParse(buffer, pdfOptions);
    const parseTime = Date.now() - parseStart;
    
    console.log(`PDF parsing completed in ${parseTime}ms`);
    console.log(`PDF Info: version=${result.info.PDFFormatVersion}, pages=${result.numpages}, encrypted=${result.info.IsEncrypted ? 'yes' : 'no'}`);
    console.log(`Extracted text length: ${result.text.length} characters`);
    
    if (result.text.length === 0) {
      console.warn('Warning: No text extracted from PDF. This might be a scanned document or image-based PDF.');
      console.log('PDF metadata:', result.metadata);
      console.log('PDF info:', result.info);
    }
    
    // Format the result
    const output = {
      text: result.text,
      numPages: result.numpages,
      metadata: {
        info: result.info,
        metadata: result.metadata
      }
    };
    
    console.log('----------- PDF PROCESSOR: PROCESS BUFFER COMPLETE -----------');
    return output;
  } catch (error) {
    console.error('Error processing PDF buffer:', error);
    console.log('Error details:', error instanceof Error ? error.stack : String(error));
    console.log('----------- PDF PROCESSOR: PROCESS BUFFER FAILED -----------');
    
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
  console.log('----------- PDF PROCESSOR: EXTRACT KEY INFO START -----------');
  console.log(`Original content length: ${pdfContent.length} characters`);
  
  // Remove excess whitespace and normalize line breaks
  const startTime = Date.now();
  const cleanedContent = pdfContent
    .replace(/\r\n/g, '\n')
    .replace(/\s+/g, ' ')
    .trim();
  
  const processingTime = Date.now() - startTime;
  console.log(`Content cleaned in ${processingTime}ms, new length: ${cleanedContent.length} characters`);
  
  // Return the processed content, truncating if it's extremely long
  // (most LLMs have token limits)
  const maxLength = 100000; // Approximately 25k tokens for most models
  if (cleanedContent.length > maxLength) {
    console.log(`Content truncated from ${cleanedContent.length} to ${maxLength} characters due to length limits`);
    const truncated = cleanedContent.substring(0, maxLength) + 
      '\n\n[Content truncated due to length...]';
    
    console.log('----------- PDF PROCESSOR: EXTRACT KEY INFO COMPLETE (TRUNCATED) -----------');
    return truncated;
  }
  
  console.log('----------- PDF PROCESSOR: EXTRACT KEY INFO COMPLETE -----------');
  return cleanedContent;
} 