import { createClient } from "@/utils/supabase/server";
var WPAPI = require( 'wpapi' );
import moment from "moment";


export async function POST(req) {

try {

  const supabase = await createClient();
  const { feedId } = await req.json();


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

    const response = await wp.categories().perPage(100).get()

    if (response.length === 0){
      return Response.json({
        data:[]
        }, { status: 200 });
    }


    return Response.json({
      data:response
    },{ status: 200 })



  }catch(err){
    console.error(err);
    return Response.json(
      { error: "Failed to get wordpress data" },
      { status: 500 }
    );
  }

}
