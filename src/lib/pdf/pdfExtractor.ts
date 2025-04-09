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
    // Convert buffer to string - this won't extract all text, but can get some basic content from text-based PDFs
    const uint8Array = new Uint8Array(buffer);
    
    // Find text sections in the PDF by looking for text markers
    // This is a simple approach that works for many text-based PDFs
    let pdfText = "";
    let pageCount = 0;
    let title = "";
    let author = "";
    
    // Convert to string preserving only ASCII text for readability
    let textContent = "";
    for (let i = 0; i < uint8Array.length; i++) {
      // Only include ASCII printable characters
      if (uint8Array[i] >= 32 && uint8Array[i] <= 126) {
        textContent += String.fromCharCode(uint8Array[i]);
      } else if (uint8Array[i] === 10 || uint8Array[i] === 13) {
        // Include newlines/line feeds
        textContent += "\n";
      }
    }
    
    // Try to identify text sections by using PDF markers
    const textRegex = /\(([^)]+)\)/g;
    let match;
    
    // Extract all text in parentheses which often contains actual text content in PDFs
    while ((match = textRegex.exec(textContent)) !== null) {
      // Only include if the matched text is likely meaningful (more than a few characters)
      if (match[1].length > 3) {
        pdfText += match[1] + " ";
      }
    }
    
    // Try to extract page count based on common patterns
    const pageMatch = textContent.match(/\/Type\s*\/Page/g);
    if (pageMatch) {
      pageCount = pageMatch.length;
    }
    
    // Try to extract title
    const titleMatch = textContent.match(/\/Title\s*\(([^)]+)\)/);
    if (titleMatch && titleMatch[1]) {
      title = titleMatch[1];
    }
    
    // Try to extract author
    const authorMatch = textContent.match(/\/Author\s*\(([^)]+)\)/);
    if (authorMatch && authorMatch[1]) {
      author = authorMatch[1];
    }
    
    return {
      success: true,
      text: pdfText || textContent,
      metadata: {
        pageCount,
        title,
        author
      }
    };
  } catch (error) {
    console.error("Error in PDF text extraction:", error);
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
 * Clean and normalize PDF text content
 * 
 * @param text Raw text extracted from PDF
 * @returns Cleaned text
 */
function cleanPdfText(text: string): string {
  return text
    .replace(/\r\n/g, '\n') // Normalize line breaks
    .replace(/\s+/g, ' ')   // Collapse multiple whitespace
    .replace(/\n{3,}/g, '\n\n') // Replace 3+ newlines with just 2
    .trim();
} 