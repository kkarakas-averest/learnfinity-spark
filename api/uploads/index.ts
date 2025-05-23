import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import * as officeparser from 'officeparser';

// Set CORS headers helper function
const setCorsHeaders = (res: VercelResponse) => {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');
  return res;
};

// File extractor type
type FileExtractor = (buffer: Buffer) => Promise<string>;

// Map of file types to extractor functions
const extractors: Record<string, FileExtractor> = {
  'application/pdf': extractFromPdf,
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': extractFromDocx,
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': extractFromPptx,
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': extractFromXlsx,
  'text/plain': extractFromText,
};

/**
 * Extract text from a PDF file using pdfjs-dist (Mozilla PDF.js) in a serverless-compatible way
 */
async function extractFromPdf(buffer: Buffer): Promise<string> {
  try {
    // Create a safe copy of the buffer to avoid SharedArrayBuffer issues
    const safeCopy = Buffer.from(buffer);
    
    // Direct CommonJS require-style import for better serverless compatibility
    // This avoids ESM resolution issues in Vercel Functions
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf');
    
    // Log information about the imported module to diagnose
    console.log("PDF.js module structure:", 
      Object.keys(pdfjsLib).join(', '));
    
    // Extract the getDocument function - try multiple known patterns
    let getDocumentFn;
    
    if (typeof pdfjsLib.getDocument === 'function') {
      getDocumentFn = pdfjsLib.getDocument;
      console.log("Using pdfjsLib.getDocument directly");
    } else if (pdfjsLib.default && typeof pdfjsLib.default.getDocument === 'function') {
      getDocumentFn = pdfjsLib.default.getDocument;
      console.log("Using pdfjsLib.default.getDocument");
    } else {
      // Last resort - scan the module for getDocument
      for (const key of Object.keys(pdfjsLib)) {
        const obj = (pdfjsLib as any)[key];
        if (obj && typeof obj.getDocument === 'function') {
          getDocumentFn = obj.getDocument;
          console.log(`Found getDocument on property '${key}'`);
          break;
        }
      }
    }
    
    if (!getDocumentFn) {
      throw new Error('PDF.js getDocument function not found in the imported module');
    }
    
    // Prepare data as Uint8Array (most compatible format)
    const uint8Array = new Uint8Array(safeCopy);
    
    console.log("Creating PDF document task...");
    
    // Create document loading task with minimal options
    const loadingTask = getDocumentFn({
      data: uint8Array,
      verbosity: 0,
      disableFontFace: true,
      isEvalSupported: false,
      useSystemFonts: false
    } as any);
    
    console.log("Awaiting PDF document...");
    
    // Access document via promise or direct (depending on PDF.js version)
    const pdf = await (loadingTask.promise ? loadingTask.promise : loadingTask);
    
    console.log(`PDF loaded with ${pdf.numPages} pages`);
    
    let textContent = '';
    
    // Extract text from each page
    const numPages = pdf.numPages || 0;
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum);
        console.log(`Processing page ${pageNum}`);
        
        // Get text content from page
        const content = await page.getTextContent();
        
        // Extract strings from content items
        const pageText = content.items
          .filter((item: any) => item.str)
          .map((item: any) => item.str)
          .join(' ');
          
        textContent += pageText + '\n\n';
      } catch (pageError) {
        console.error(`Error extracting text from page ${pageNum}:`, pageError);
        textContent += `[Error extracting text from page ${pageNum}]\n\n`;
      }
    }

    if (textContent && textContent.trim().length > 0) {
      return textContent;
    } else {
      return 'No text content could be extracted from this PDF. It may be scanned or contain only images.';
    }
  } catch (error) {
    console.error('Error extracting text from PDF with pdfjs-dist:', error);
    return 'Error extracting text from PDF. File may be corrupted, password protected, or incompatible with our extraction method.';
  }
}

/**
 * Extract text from a DOCX file using officeparser
 */
async function extractFromDocx(buffer: Buffer): Promise<string> {
  try {
    const data = await officeparser.parseOfficeAsync(buffer);
    
    if (!data || data.trim().length === 0) {
      console.warn('Extracted DOCX text is empty');
      return 'No text content could be extracted from this document.';
    }
    
    return data;
  } catch (error) {
    console.error('Error in DOCX extraction:', error);
    return 'Error extracting text from DOCX. File may be corrupted.';
  }
}

/**
 * Extract text from a PowerPoint presentation (PPTX) using officeparser
 */
async function extractFromPptx(buffer: Buffer): Promise<string> {
  try {
    const options = {
      // Options specific to PowerPoint files
      ignoreNotes: false,    // Include slide notes
      newlineDelimiter: '\n' // Use standard newlines
    };
    
    const data = await officeparser.parseOfficeAsync(buffer, options);
    
    if (!data || data.trim().length === 0) {
      console.warn('Extracted PPTX text is empty');
      return 'No text content could be extracted from this presentation. It may contain only images or shapes.';
    }
    
    return data;
  } catch (error) {
    console.error('Error in PPTX extraction:', error);
    return 'Error extracting text from PPTX. File may be corrupted.';
  }
}

/**
 * Extract text from an Excel spreadsheet (XLSX) using officeparser
 */
async function extractFromXlsx(buffer: Buffer): Promise<string> {
  try {
    const data = await officeparser.parseOfficeAsync(buffer);
    
    if (!data || data.trim().length === 0) {
      console.warn('Extracted XLSX text is empty');
      return 'No text content could be extracted from this spreadsheet.';
    }
    
    return data;
  } catch (error) {
    console.error('Error in XLSX extraction:', error);
    return 'Error extracting text from XLSX. File may be corrupted.';
  }
}

/**
 * Extract text from a plain text file
 */
async function extractFromText(buffer: Buffer): Promise<string> {
  return buffer.toString('utf-8');
}

/**
 * API endpoint for uploading and processing document for CourseAI
 * 
 * This handles:
 * 1. File upload to Supabase storage
 * 2. Creating a record in hr_uploads table
 * 3. Extracting text content from the document
 * 
 * Request format: multipart/form-data with:
 * - file: The document file (PDF, DOCX, PPTX, XLSX, TXT)
 * - companyId: (optional) Company ID for organization
 * 
 * Response format:
 * {
 *   success: boolean,
 *   uploadId?: string,
 *   filePath?: string,
 *   fileName?: string,
 *   fileType?: string,
 *   extracted?: boolean,
 *   textPreview?: string,
 *   error?: string
 * }
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Set CORS headers
  setCorsHeaders(res);
  
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed. Use POST.' 
    });
  }

  // Hardcoded Supabase credentials for development (should use environment variables in production)
  const SUPABASE_URL = 'https://ujlqzkkkfatehxeqtbdl.supabase.co';
  const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqbHF6a2trZmF0ZWh4ZXF0YmRsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MDY4MDgzMiwiZXhwIjoyMDU2MjU2ODMyfQ.A2AVZwetKe-CIJUzVcNm0OdNlceABZvDFU6YsX3kDRA';
  
  try {
    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });

    // Check for authentication (could be JWT or dev token in header)
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        error: 'Authentication required' 
      });
    }

    // Get the file data from request
    if (!req.body.file || !req.body.fileName || !req.body.fileType) {
      return res.status(400).json({ 
        success: false, 
        error: 'Required data missing: file, fileName, and fileType are required' 
      });
    }

    const { file, fileName, fileType, companyId } = req.body;
    
    // Check if file is provided as base64 string and decode
    let fileBuffer: Buffer;
    if (typeof file === 'string' && file.includes('base64,')) {
      // Extract base64 data
      const base64Data = file.split('base64,')[1];
      fileBuffer = Buffer.from(base64Data, 'base64');
    } else if (Buffer.isBuffer(file)) {
      fileBuffer = file;
    } else {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid file format' 
      });
    }

    // Generate a unique file path
    const safeFileName = fileName.replace(/[^a-zA-Z0-9.]/g, '_');
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const filePath = `course-documents/${timestamp}_${randomString}_${safeFileName}`;
    
    // Upload file to Supabase storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('course-documents')
      .upload(filePath, fileBuffer, {
        contentType: fileType,
        cacheControl: '3600',
        upsert: false
      });
      
    if (uploadError) {
      console.error('Error uploading file:', uploadError);
      return res.status(500).json({ 
        success: false, 
        error: `Failed to upload file: ${uploadError.message}` 
      });
    }
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from('course-documents')
      .getPublicUrl(filePath);
    
    // Create a record in hr_uploads table
    const uploadId = uuidv4();
    const { error: insertError } = await supabase
      .from('hr_uploads')
      .insert({
        id: uploadId,
        company_id: null,
        file_path: filePath,
        file_name: fileName,
        file_type: fileType,
        processed: false
      });
      
    if (insertError) {
      console.error('Error creating upload record:', insertError);
      return res.status(500).json({ 
        success: false, 
        error: `Failed to create upload record: ${insertError.message}` 
      });
    }
    
    // Extract text based on file type
    let extractedText = '';
    let extracted = false;
    
    const extractor = extractors[fileType];
    if (extractor) {
      try {
        extractedText = await extractor(fileBuffer);
        
        // Update the record with extracted text
        const { error: updateError } = await supabase
          .from('hr_uploads')
          .update({
            extracted_text: extractedText,
            processed: true
          })
          .eq('id', uploadId);
          
        if (updateError) {
          console.error('Error updating extracted text:', updateError);
        } else {
          extracted = true;
        }
      } catch (extractError) {
        console.error('Error extracting text:', extractError);
      }
    }
    
    // Return success response
    return res.status(200).json({
      success: true,
      uploadId,
      filePath: urlData.publicUrl,
      fileName,
      fileType,
      extracted,
      textPreview: extractedText ? extractedText.substring(0, 200) + '...' : ''
    });
    
  } catch (error) {
    console.error('Error processing upload:', error);
    
    return res.status(500).json({
      success: false,
      error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }
} 