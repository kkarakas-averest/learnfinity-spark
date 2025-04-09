import { NextRequest, NextResponse } from 'next/server';
import pdf from 'pdf-parse';

export const runtime = 'nodejs'; // Ensure Node.js runtime for pdf-parse

// Simple function to clean text: normalize whitespace, remove non-printables
function cleanText(text: string): string {
  return text
    .replace(/\r\n/g, '\n')        // Normalize line breaks
    .replace(/\n{3,}/g, '\n\n')    // Collapse excessive newlines
    .replace(/\s{2,}/g, ' ')       // Collapse multiple spaces/tabs into single space
    .replace(/[^\x20-\x7E\n]/g, '') // Remove non-printable ASCII chars (excluding newline)
    .trim();                     // Trim leading/trailing whitespace
}

export async function POST(request: NextRequest) {
  console.log("--- API: extract-pdf START ---");
  try {
    const { pdfUrl } = await request.json();

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

    // Parse PDF using pdf-parse
    console.log("Parsing PDF using pdf-parse...");
    const data = await pdf(Buffer.from(arrayBuffer));
    console.log(`PDF parsed successfully. Pages: ${data.numpages}, Chars: ${data.text.length}`);

    // Clean the extracted text
    const cleanedText = cleanText(data.text);

    console.log("--- API: extract-pdf COMPLETE ---");
    return NextResponse.json({
      success: true,
      text: cleanedText,
      metadata: {
        pageCount: data.numpages,
        info: data.info // Includes title, author etc. if available
      }
    }, { status: 200 });

  } catch (error) {
    console.error("Error in extract-pdf API:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error during PDF extraction';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
