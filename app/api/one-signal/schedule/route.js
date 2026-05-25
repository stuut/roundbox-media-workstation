import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export const runtime = 'nodejs'

export async function POST(req) {

  try {

    const { channelId, data } = await req.json();

    const { data: channel, error } = await supabase
    .from("platform_accounts")
    .select(`*`)
    .eq("id", channelId)

    if (error) throw error

    if (!channel) {
      return Response.json({ message: "No Social Channel found" },{ status: 500 })
    }

    const options = {
      method: 'POST',
      headers: {
        Authorization: `Basic ${channel[0].access_token}`,
        'Content-Type': 'application/json'},
      body: JSON.stringify(data)
    }


    const onesignalResponse = await fetch('https://onesignal.com/api/v1/notifications', options)

    if (!onesignalResponse.ok) {
     return Response.json({ message: `Failed to schedule One Signal: ${onesignalResponse.status}` },{ status: 500 })
    }

    const onesignalResponseJson = await onesignalResponse.json();

    return Response.json({ id:onesignalResponseJson.id },{ status: 200 })

  }catch (err){
    console.error(err);
    return Response.json(
      { error: "Failed to Schedule One Signal" },
      { status: 500 }
    );
  }

}
