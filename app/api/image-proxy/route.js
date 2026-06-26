// app/api/image-proxy/route.js
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  const res = await fetch(url);
  const buffer = await res.arrayBuffer();

  return new Response(buffer, {
    headers: {
      'Content-Type': res.headers.get('Content-Type') || 'image/jpeg',
      'Cache-Control': 'public, max-age=31536000',
    },
  });
}
