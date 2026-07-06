import { createClient } from "@/utils/supabase/server";
import moment from "moment";
var WPAPI = require( 'wpapi' );


export async function POST(req) {

  try {

    const supabase = await createClient();
    const {
      feedId,
      title,
      content,
      featured_media,
      categories,
      acf
    } = await req.json();

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

      const wpapiUrl = 'https://' + selectedFeed.website + '/wp-json'

      const wp = new WPAPI({
          endpoint: wpapiUrl,
          username: selectedFeed.username,
          password: selectedFeed.password,
      });

      const post = await wp.posts().create({
          // "title" and "content" are the only required properties
          title: title,
          content: content,
          featured_media: featured_media?featured_media:0,
          // Post will be created as a draft by default if a specific "status"
          // is not specified
          status: 'draft',
          acf: acf,
          categories:categories,
          //categories: [2]
          })



          return Response.json({
            data:post
          },{ status: 200 })




  }catch(err){
    console.error(err);
    return Response.json(
      { error: "Failed to get contentful data" },
      { status: 500 }
    );
  }
}
