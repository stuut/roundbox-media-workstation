import { createClient } from "@/utils/supabase/server";
import moment from "moment";
import * as contentful from 'contentful'


export async function POST(req) {

try {

  const supabase = await createClient();
  const { feedId, contentType, order } = await req.json();


  if (!feedId) {
    return Response.json({ message: "No Feed Id" },{ status: 500 })
  }

  const { data, error } = await supabase

  .from("feeds")
  .select(`*`)
  .eq("id", feedId)

    if (error) throw error

    if (!data) {
      return Response.json({ message: "No Feed Data found" },{ status: 500 })
    }

    const selectedFeed = data[0]

    const client = contentful.createClient({
      space: selectedFeed.spaceId,
      accessToken: selectedFeed.accessToken,
    })

    const response = await client.getEntries({
      'content_type': contentType,
      'order': order?order:'sys.updatedAt',
       'limit': '1000',
      'include': '10',
    })



    if (response.length === 0){
      return Response.json({
        data:[]
        }, { status: 200 });
    }


    return Response.json({
      data:response.items
    },{ status: 200 })



  }catch(err){
    console.error(err);
    return Response.json(
      { error: "Failed to get contentful data" },
      { status: 500 }
    );
  }

}
