import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export const runtime = 'nodejs'


export async function POST(req) {


  try {

    const { channelId, postId} = await req.json();

    const { data: channel, error } = await supabase
    .from("platform_accounts")
    .select(`*`)
    .eq("id", channelId)

    if (error) throw error

    if (!channel) {
      return Response.json({ message: "No Social Channel found" },{ status: 500 })
    }

    if (!postId) {
      return Response.json({ message: "No Post Id" },{ status: 500 })
    }

    const accessToken = channel[0]?.access_token

    if (!accessToken) {
      return Response.json({ message: "No Access Token Found" },{ status: 500 })
    }


    const facebookResponse = await fetch(`https://graph.facebook.com/v23.0/${postId}?fields=is_published,scheduled_publish_time,created_time,status_type&access_token=${accessToken}`);


    if (!facebookResponse.ok) {
      console.log('facebookResponse', facebookResponse)
      return Response.json({ message: `Getting Post info failed with status: ${facebookResponse.status}` },{ status: 500 })
    }

  const postResponseJson = await facebookResponse.json();


  return Response.json({ success:true, data:postResponseJson},{ status: 200 })


  }catch (err){
    console.error(err);
    return Response.json(
      { error: "Failed to Schedule facebook post" },
      { status: 500 }
    );
  }

}
