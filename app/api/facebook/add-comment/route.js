import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export const runtime = 'nodejs'


export async function POST(req) {

  try {

    const { channelId, postId, postLink } = await req.json();

    const { data: channel, error } = await supabase
    .from("platform_accounts")
    .select(`*`)
    .eq("id", channelId)

    if (error) throw error

    if (!channel) {
      return Response.json({ message: "No Social Channel found" },{ status: 500 })
    }

    const accessToken = channel[0].access_token


    if (postLink){
      await addFacebookComment(
        postId,
        postLink,
        accessToken
      );
    }


  return Response.json({ success:true},{ status: 200 })


  }catch (err){
    console.error(err);
    return Response.json(
      { error: "Failed to Schedule facebook post" },
      { status: 500 }
    );
  }

}



async function addFacebookComment(postId, postLink, accessToken, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const commentResponse = await fetch(
        `https://graph.facebook.com/${postId}/comments`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: 'Check out the full details here: ' + postLink,
            access_token: accessToken,
          }),
        }
      );

      if (!commentResponse.ok) {

        return Response.json(
          { error: commentResponse},
          { status: 500 })

      }

      return await commentResponse.json();
    } catch (error) {
      if (attempt === retries) {
        throw error;
      }

      // wait 1 second before retrying
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
}
