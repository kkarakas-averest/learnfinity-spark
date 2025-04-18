
import { NextResponse } from 'next/server';

// Simple API endpoint that always returns valid JSON
// This can be used as a fallback when other API routes return HTML instead of JSON
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'API is working correctly',
    timestamp: new Date().toISOString()
  });
}

export async function POST() {
  return NextResponse.json({
    status: 'ok',
    message: 'POST request received',
    timestamp: new Date().toISOString()
  });
}
