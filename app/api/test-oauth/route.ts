import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  // Log everything GitHub sends us
  console.log('=== COMPLETE OAUTH TEST ===');
  console.log('Method:', request.method);
  console.log('Full URL:', request.url);
  console.log('All search params:', Object.fromEntries(searchParams.entries()));
  console.log('Headers:', Object.fromEntries(request.headers.entries()));
  console.log('========================');
  
  // Return a simple JSON response so we can see what we received
  return NextResponse.json({
    method: request.method,
    url: request.url,
    searchParams: Object.fromEntries(searchParams.entries()),
    timestamp: new Date().toISOString()
  });
}
