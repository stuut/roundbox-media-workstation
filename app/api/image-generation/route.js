import { NextResponse } from 'next/server';

export async function POST(request) {
  const { prompt, image: inputImage, history  } = await request.json();



  try {


    return new Response(JSON.stringify({ message: 'Email sent', info }), {
      status: 200,
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: 'Email failed to send' }), {
      status: 500,
    });
  }
}
