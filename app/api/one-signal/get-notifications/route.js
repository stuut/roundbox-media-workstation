import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export const runtime = 'nodejs'

export async function POST(req) {

  try {

    const { channelId } = await req.json();

    const { data: channel, error } = await supabase
    .from("platform_accounts")
    .select(`*`)
    .eq("id", channelId)

    if (error) throw error

    if (!channel) {
      return Response.json({ message: "No Social Channel found" },{ status: 500 })
    }


    const accessToken = channel[0].access_token
    const app_id = channel[0].external_account_id

    const options = {method: 'GET', headers: {Authorization: `Key ${accessToken}`}};


    const onesignalResponse = await fetch(`https://api.onesignal.com/notifications?app_id=${app_id}&limit=100&kind=1&time_offset=2026-05-24T00:00:00.000Z`, options)


    if (!onesignalResponse.ok) {
     return Response.json({ message: `Failed to get One Signal notifications: ${onesignalResponse.status}` },{ status: 500 })
    }

    const onesignalResponseJson = await onesignalResponse.json();

    return Response.json({onesignalResponseJson},{ status: 200 })

  }catch (err){
    console.error(err);
    return Response.json(
      { error: "Failed to get One Signal notifications" },
      { status: 500 }
    );
  }

}
