/**
 * PDF Extractor Service
 * 
 * A client-side PDF text extraction service that works in browser environments
 * using the built-in fetch API and text extraction techniques.
 */

/**
 * Result of PDF text extraction
 */
interface PDFExtractionResult {
  success: boolean;
  text: string;
  metadata?: {
    pageCount?: number;
    title?: string;
    author?: string;
    error?: string;
  };
}

/**
 * Extract text from a PDF URL directly in the browser
 * This approach avoids server-side dependencies and works across all environments
 * 
 * @param pdfUrl URL of the PDF to extract text from
 * @returns A promise with the extracted text
 */
export async function extractTextFromPdf(pdfUrl: string): Promise<PDFExtractionResult> {
  console.log(`Extracting text from PDF URL: ${pdfUrl}`);
  
  try {
    // Use the fetch API directly (available in modern browsers)
    const response = await fetch(pdfUrl, {
      method: 'GET',
      headers: {
        // Include cache control headers to avoid caching issues
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`);
    }
    
    // Get PDF as array buffer
    const arrayBuffer = await response.arrayBuffer();
    
    if (!arrayBuffer || arrayBuffer.byteLength === 0) {
      throw new Error("Received empty PDF data");
    }
    
    console.log(`PDF fetched, size: ${arrayBuffer.byteLength} bytes`);
    
    // Use simplified string extraction for text-based PDFs
    const textResult = await extractTextFromBuffer(arrayBuffer);
    
    if (!textResult.success || !textResult.text || textResult.text.trim() === '') {
      console.warn("Text extraction yielded no content, PDF might be image-based or encrypted");
      
      // Return a basic result for image-based PDFs
      return {
        success: true,
        text: "This appears to be an image-based or encrypted PDF that doesn't contain extractable text content. Please provide a text-based PDF for better analysis.",
        metadata: {
          error: "No extractable text content found in PDF"
        }
      };
    }
    
    // Clean up the extracted text
    const cleanedText = cleanPdfText(textResult.text);
    
    return {
      success: true,
      text: cleanedText,
      metadata: textResult.metadata
    };
  } catch (error) {
    console.error("Error extracting PDF text:", error);
    
    return {
      success: false,
      text: "",
      metadata: {
        error: error instanceof Error ? error.message : String(error)
      }
    };
  }
}

/**
 * Extract text from an array buffer containing PDF data
 * This is a simplified approach that works for basic text-based PDFs
 * 
 * @param buffer The PDF data as an ArrayBuffer
 * @returns Extracted text and metadata
 */
async function extractTextFromBuffer(buffer: ArrayBuffer): Promise<PDFExtractionResult> {
  try {
    const uint8Array = new Uint8Array(buffer);
    let pdfText = "";
    let pageCount = 0;
    let title = "";
    let author = "";

    // Simplified text conversion - focus on printable ASCII and basic structure
    let textContent = "";
    for (let i = 0; i < uint8Array.length; i++) {
      const charCode = uint8Array[i];
      // Include printable ASCII characters (space to ~)
      if (charCode >= 32 && charCode <= 126) {
        textContent += String.fromCharCode(charCode);
      } else if (charCode === 10 || charCode === 13) {
        // Preserve line breaks
        textContent += "\n";
      }
    }

    // Use a simpler regex to find potential text blocks within PDF structures
    // This looks for text enclosed in parentheses, often used for text objects
    const textRegex = /\(([^)]+)\)/g;
    let match;
    let extractedParenthesesText = "";
    while ((match = textRegex.exec(textContent)) !== null) {
      // Basic check to avoid very short/irrelevant matches
      if (match[1] && match[1].trim().length > 2) {
        extractedParenthesesText += match[1].trim() + "\n"; 
      }
    }

    // Prioritize the text extracted from parentheses if substantial
    // Otherwise, fall back to the basic ASCII conversion
    if (extractedParenthesesText.length > textContent.length * 0.1 || extractedParenthesesText.length > 500) { // If extracted text seems significant
      pdfText = extractedParenthesesText;
      console.log("Using text extracted from PDF parentheses markers.");
    } else {
      pdfText = textContent;
      console.log("Using basic ASCII text conversion as primary source.");
    }

    // Try to extract metadata (less critical but useful)
    const pageMatch = textContent.match(/\/Type\s*\/Page/g);
    pageCount = pageMatch ? pageMatch.length : 0;
    const titleMatch = textContent.match(/\/Title\s*\(([^)]+)\)/);
    title = titleMatch && titleMatch[1] ? titleMatch[1] : "";
    const authorMatch = textContent.match(/\/Author\s*\(([^)]+)\)/);
    author = authorMatch && authorMatch[1] ? authorMatch[1] : "";

    return {
      success: true,
      text: pdfText,
      metadata: { pageCount, title, author }
    };
  } catch (error) {
    console.error("Error in PDF text extraction:", error);
    return {
      success: false,
      text: "",
      metadata: { error: error instanceof Error ? error.message : String(error) }
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
  // Simplified cleaning: focus on whitespace and basic normalization
  return text
    .replace(/\r\n/g, '\n')        // Normalize line breaks
    .replace(/\n{3,}/g, '\n\n')    // Collapse excessive newlines
    .replace(/\s{2,}/g, ' ')       // Collapse multiple spaces/tabs into single space
    .replace(/[^\x20-\x7E\n]/g, '') // Remove non-printable ASCII chars (excluding newline)
    .replace(/•/g, '* ')          // Standardize bullets
    .trim();                     // Trim leading/trailing whitespace
} 