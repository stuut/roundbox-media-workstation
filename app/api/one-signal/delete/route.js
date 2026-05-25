import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export const runtime = 'nodejs'

export async function POST(req) {

  try {

    const { channelId, notificationId } = await req.json();

    const { data: channel, error } = await supabase
    .from("platform_accounts")
    .select(`*`)
    .eq("id", channelId)

    if (error) throw error

    if (!channel) {
      return Response.json({ message: "No Social Channel found" },{ status: 500 })
    }

    const onesignalDeleteResponse = await fetch(`https://onesignal.com/api/v1/notifications/${notificationId}?app_id=${channel[0].external_account_id}`, {
        headers: {
          Authorization: "Basic "+channel[0]?.access_token,
        },
        method: "DELETE"
      })

    if (!onesignalDeleteResponse.ok) {
     return Response.json({ message: `Failed to delete One Signal notification: ${onesignalResponse.status}` },{ status: 500 })
    }

    const onesignalDeleteResponseJson = await onesignalDeleteResponse.json();

    console.log('onesignalDeleteResponseJson', onesignalDeleteResponseJson)

    return Response.json({ success:onesignalDeleteResponseJson.success },{ status: 200 })

  }catch (err){
    console.error(err);
    return Response.json(
      { error: "Failed to delete One Signal notification" },
      { status: 500 }
    );
  }

}
