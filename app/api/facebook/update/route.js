import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export const runtime = 'nodejs'


export async function POST(req) {

  try {

    const { channelId, postData, endPoint } = await req.json();

    const { data: channel, error } = await supabase
    .from("platform_accounts")
    .select(`*`)
    .eq("id", channelId)

    if (error) throw error

    if (!channel) {
      return Response.json({ message: "No Social Channel found" },{ status: 500 })
    }

    if (!postData) {
      return Response.json({ message: "No Post Data" },{ status: 500 })
    }

    if (!endPoint) {
      return Response.json({ message: "No Endpoint" },{ status: 500 })
    }


    const accessToken = channel[0]?.access_token

    if (!accessToken) {
      return Response.json({ message: "No Access Token Found" },{ status: 500 })
    }

    postData.access_token = accessToken

    console.log('postData', postData)

    console.log('endPoint', endPoint)


    const facebookResponse = await fetch(`https://graph.facebook.com/v24.0/${endPoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData),
      })

  if (!facebookResponse.ok) {
    return Response.json({ message: `Update to facebook failed with status: ${facebookResponse.status}` },{ status: 500 })
  }

  const postResponseJson = await facebookResponse.json();
  const postId = postResponseJson.id


  return Response.json({ success:true, id:postResponseJson.id, data:postResponseJson },{ status: 200 })


  }catch (err){
    console.error(err);
    return Response.json(
      { error: "Failed to Schedule facebook post" },
      { status: 500 }
    );
  }

}
