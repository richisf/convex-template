import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    console.log('GitHub OAuth callback received:', {
      code: code ? 'present' : 'missing',
      state: state ? 'present' : 'missing',
      error: error || 'none'
    });

    // Handle OAuth errors
    if (error) {
      const errorMessage = searchParams.get('error_description') || error;
      return NextResponse.redirect(
        new URL(`/github?error=${error}&error_message=${encodeURIComponent(errorMessage)}`, request.url)
      );
    }

    // Check for missing code
    if (!code) {
      return NextResponse.redirect(
        new URL('/github?error=missing_code&error_message=Missing authorization code', request.url)
      );
    }

    // Redirect to frontend with code and state for processing
    return NextResponse.redirect(
      new URL(`/github?code=${code}&state=${state}`, request.url)
    );

  } catch (error) {
    console.error('GitHub OAuth callback error:', error);
    return NextResponse.redirect(
      new URL('/github?error=server_error&error_message=Unexpected server error', request.url)
    );
  }
}
