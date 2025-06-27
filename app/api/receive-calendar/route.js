export async function POST(req) {
  const { body } = await req.json();
  console.log(body);
  // TODO: Save to DB or calendar logic here

  return Response.json({ success: true });
}
