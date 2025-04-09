import { NextRequest, NextResponse } from 'next/server';
import { extractTextFromPdfUrl, extractKeyInformation } from '@/lib/server/pdfProcessor';

/**
 * API endpoint for extracting text from a PDF URL
 * Used by the client to get PDF text content for CV analysis
 */
export async function POST(req: NextRequest) {
  console.log('----------- PDF TEXT EXTRACTION API START -----------');
  
  try {
    // Parse request body
    const body = await req.json();
    const { pdfUrl } = body;
    
    // Validate input
    if (!pdfUrl) {
      console.error('Missing PDF URL in request');
      return NextResponse.json({ error: 'PDF URL is required' }, { status: 400 });
    }
    
    console.log(`Extracting text from PDF URL: ${pdfUrl}`);
    
    // Extract text from the PDF
    console.log('Calling PDF extraction library');
    const startTime = Date.now();
    const pdfResult = await extractTextFromPdfUrl(pdfUrl);
    const extractionTime = Date.now() - startTime;
    console.log(`PDF extraction completed in ${extractionTime}ms`);
    
    if (!pdfResult.text || pdfResult.text.trim() === '') {
      console.error(`Failed to extract text from PDF: ${pdfResult.metadata.error || 'No text content'}`);
      console.log('PDF extraction result:', pdfResult);
      return NextResponse.json(
        { error: 'Failed to extract text from PDF', details: pdfResult.metadata.error }, 
        { status: 500 }
      );
    }
    
    console.log(`Raw PDF text extracted: ${pdfResult.text.length} characters, ${pdfResult.numPages} pages`);
    console.log(`PDF metadata:`, pdfResult.metadata);
    
    // Process the extracted text to clean it up
    console.log('Processing and normalizing extracted text');
    const processedText = extractKeyInformation(pdfResult.text);
    console.log(`Processed text: ${processedText.length} characters (${Math.round((processedText.length / pdfResult.text.length) * 100)}% of original)`);
    
    // Return the extracted text
    console.log('Returning processed text to client');
    console.log('----------- PDF TEXT EXTRACTION API COMPLETE -----------');
    
    return NextResponse.json({
      success: true,
      text: processedText,
      metadata: {
        numPages: pdfResult.numPages,
        textLength: processedText.length,
        processingTimeMs: extractionTime
      }
    });
  } catch (error: any) {
    console.error('Error extracting PDF text:', error);
    console.log('Error details:', error.stack || error);
    console.log('----------- PDF TEXT EXTRACTION API FAILED -----------');
    
    return NextResponse.json(
      { error: 'Failed to extract PDF text', details: error.message }, 
      { status: 500 }
    );
  }
} 