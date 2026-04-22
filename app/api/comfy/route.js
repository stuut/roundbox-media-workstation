
export async function POST(req) {
  try {

    const body = await req.json(); // Parses the JSON body

    const API_URL = "http://127.0.0.1:8188/prompt";

    const clientId = '12345'

    const payload = {
      prompt: body,
      client_id: clientId
    };

    const apiResponse = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await apiResponse.json();




    return new Response(
      JSON.stringify({ data: data }),
      { status: 200 }
    );
  } catch (err) {
    console.error(err);
    return new Response(
      JSON.stringify({ error: 'Conversion failed' }),
      { status: 500 }
    );
  }
}
