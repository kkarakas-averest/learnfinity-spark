import { NextResponse } from 'next/server';

/**
 * Simple test endpoint to validate API routing
 * GET /api/test-api
 */
export async function GET() {
  console.log('Test API endpoint was called - GET');
  return NextResponse.json({
    success: true,
    message: 'Test API is working correctly',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown',
  });
}

/**
 * POST /api/test-api
 */
export async function POST() {
  console.log('Test API endpoint was called - POST');
  return NextResponse.json({
    success: true,
    message: 'Test API is working correctly for POST requests',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown',
  });
} 