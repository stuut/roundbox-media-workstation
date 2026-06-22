// app/api/r2-proxy/route.js
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get('key');

  const r2Url = `https://pub-d6323aeb43a84ab4a229b45727a1e7ee.r2.dev/${key}`;
  const res = await fetch(r2Url);

  return new Response(res.body, {
    headers: {
      'Content-Type': res.headers.get('Content-Type'),
      'Cache-Control': 'public, max-age=31536000',
    },
  });
}
