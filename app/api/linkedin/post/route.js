// app/api/linkedin/post/route.js

import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(req) {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (!token) {
    return NextResponse.json({ error: 'Missing access token' }, { status: 401 });
  }

  try {
    const me = await axios.get('https://api.linkedin.com/v2/me', {
      headers: { Authorization: `Bearer ${token}` },
    });

    const personURN = `urn:li:person:${me.data.id}`;

    const post = await axios.post(
      'https://api.linkedin.com/v2/ugcPosts',
      {
        author: personURN,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: 'Hello LinkedIn! This was posted from a Next.js App Router app 🎉',
            },
            shareMediaCategory: 'NONE',
          },
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
        },
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0',
        },
      }
    );

    return NextResponse.json({ success: true, data: post.data });
  } catch (err) {
    console.error(err.response?.data || err.message);
    return NextResponse.json({ error: 'Failed to post to LinkedIn' }, { status: 500 });
  }
}
