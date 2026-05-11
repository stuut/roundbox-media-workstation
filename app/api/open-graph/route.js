import { NextResponse } from 'next/server';
import ogs from 'open-graph-scraper';

export async function POST(request) {
  try {
    const { url } = await request.json();

    const { result } = await ogs({ url });

    return NextResponse.json(
      { result },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
