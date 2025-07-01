// app/api/linkedin/callback/route.js

import { NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const redirectUri = process.env.NEXT_PUBLIC_LINKEDIN_REDIRECT_URI;

  try {
    const response = await axios.post(
      'https://www.linkedin.com/oauth/v2/accessToken',
      new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: process.env.LINKEDIN_CLIENT_ID,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    const accessToken = response.data.access_token;

    // Redirect to frontend page with token
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001'}/linkedin-success?token=${accessToken}`
    );
  } catch (err) {
    console.error(err.response?.data || err.message);
    return new NextResponse(JSON.stringify({ error: 'Token exchange failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
