import { NextRequest, NextResponse } from 'next/server';
import { extractTextFromPdfUrl, extractKeyInformation } from '@/lib/server/pdfProcessor';

/**
 * API endpoint for extracting text from a PDF URL
 * Used by the client to get PDF text content for CV analysis
 */
export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const body = await req.json();
    const { pdfUrl } = body;
    
    // Validate input
    if (!pdfUrl) {
      return NextResponse.json({ error: 'PDF URL is required' }, { status: 400 });
    }
    
    console.log(`Extracting text from PDF URL: ${pdfUrl}`);
    
    // Extract text from the PDF
    const pdfResult = await extractTextFromPdfUrl(pdfUrl);
    
    if (!pdfResult.text || pdfResult.text.trim() === '') {
      console.error(`Failed to extract text from PDF: ${pdfResult.metadata.error || 'Unknown error'}`);
      return NextResponse.json(
        { error: 'Failed to extract text from PDF', details: pdfResult.metadata.error }, 
        { status: 500 }
      );
    }
    
    // Process the extracted text to clean it up
    const processedText = extractKeyInformation(pdfResult.text);
    
    // Return the extracted text
    return NextResponse.json({
      success: true,
      text: processedText,
      metadata: {
        numPages: pdfResult.numPages,
        textLength: processedText.length
      }
    });
  } catch (error: any) {
    console.error('Error extracting PDF text:', error);
    return NextResponse.json(
      { error: 'Failed to extract PDF text', details: error.message }, 
      { status: 500 }
    );
  }
} 