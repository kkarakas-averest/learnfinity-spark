import { NextRequest, NextResponse } from 'next/server';

// Use edge runtime for better compatibility with Vercel
export const runtime = 'edge';

// Simple function to clean text: normalize whitespace, remove non-printables
function cleanText(text: string): string {
  return text
    .replace(/\r\n/g, '\n')        // Normalize line breaks
    .replace(/\n{3,}/g, '\n\n')    // Collapse excessive newlines
    .replace(/\s{2,}/g, ' ')       // Collapse multiple spaces/tabs into single space
    .replace(/[^\x20-\x7E\n]/g, '') // Remove non-printable ASCII chars (excluding newline)
    .trim();                     // Trim leading/trailing whitespace
}

// Simple function to extract text from PDF using regex patterns on raw data
function extractTextFromPdfBuffer(buffer: ArrayBuffer): string {
  try {
    // Convert buffer to string
    const uint8Array = new Uint8Array(buffer);
    let textContent = "";
    
    // Basic approach: extract text by converting to string and preserving basic ASCII characters
    for (let i = 0; i < uint8Array.length; i++) {
      const charCode = uint8Array[i];
      if (charCode >= 32 && charCode <= 126) {
        textContent += String.fromCharCode(charCode);
      } else if (charCode === 10 || charCode === 13) {
        textContent += "\n";
      }
    }
    
    // Extract text between parentheses, which often contains actual text in PDFs
    const textRegex = /\(([^)]+)\)/g;
    let extractedText = "";
    let match;
    
    while ((match = textRegex.exec(textContent)) !== null) {
      if (match[1] && match[1].trim().length > 2) {
        extractedText += match[1].trim() + "\n";
      }
    }
    
    return extractedText.length > 500 ? extractedText : textContent;
  } catch (error) {
    console.error("Error in simple PDF text extraction:", error);
    return "";
  }
}

export async function POST(request: NextRequest) {
  console.log("--- API: extract-pdf START (edge runtime) ---");
  try {
    const data = await request.json();
    const { pdfUrl } = data;

    if (!pdfUrl || typeof pdfUrl !== 'string') {
      console.error("Invalid request: pdfUrl missing or not a string");
      return NextResponse.json({ error: 'pdfUrl is required' }, { status: 400 });
    }

    console.log(`Fetching PDF from URL: ${pdfUrl}`);

    // Fetch the PDF content
    const response = await fetch(pdfUrl, {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });

    if (!response.ok) {
      console.error(`Failed to fetch PDF: ${response.status} ${response.statusText}`);
      return NextResponse.json({ error: `Failed to fetch PDF: ${response.statusText}` }, { status: response.status });
    }

    // Get PDF as ArrayBuffer
    const arrayBuffer = await response.arrayBuffer();
    if (!arrayBuffer || arrayBuffer.byteLength === 0) {
      console.error("Received empty PDF data");
      return NextResponse.json({ error: 'Received empty PDF data' }, { status: 500 });
    }
    console.log(`PDF fetched, size: ${arrayBuffer.byteLength} bytes`);

    // Extract text using our basic method (no external dependencies)
    const extractedText = extractTextFromPdfBuffer(arrayBuffer);
    console.log(`Extracted ${extractedText.length} characters from PDF`);
    
    // Clean the extracted text
    const cleanedText = cleanText(extractedText);
    console.log(`Cleaned text length: ${cleanedText.length} characters`);

    console.log("--- API: extract-pdf COMPLETE (edge runtime) ---");
    return NextResponse.json({
      success: true,
      text: cleanedText,
      metadata: {
        pageCount: 0,  // We can't determine this accurately without pdf-parse
        textLength: cleanedText.length,
      }
    }, { status: 200 });

  } catch (error) {
    console.error("Error in extract-pdf API:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error during PDF extraction';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
