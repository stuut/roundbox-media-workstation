import { createClient } from "@/utils/supabase/server";
var WPAPI = require( 'wpapi' );
import moment from "moment";


export async function POST(req) {

try {

  const supabase = await createClient();
  const { feedId, dateFilter } = await req.json();


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

    let wp

    let response

    if (selectedFeed.query_field){
          wp = new WPAPI({ endpoint: wpapiUrl });
          //site.myCustomResource = site.registerRoute( 'wp/v2', content.queryField );
          wp.myCustomResource = wp.registerRoute( 'wp/v2', selectedFeed.query_field, {
              params: [ 'order', 'orderby', 'after']
          });
                  //site.myCustomResource(); // => myplugin/v1/author/17
           if (selectedFeed.useDateFilter && dateFilter){

             let date = moment(dateFilter).format('YYYY-MM-DD')+'T00:00:00';

             response = await wp.myCustomResource().order('desc').orderby('date').after(new Date(date)).get()

           }else{
             response = await wp.myCustomResource().get()

           }
    }else{
      wp = new WPAPI({
          endpoint: wpapiUrl,
          username: selectedFeed.editor,
          password: selectedFeed.password,
      });

      if (selectedFeed.useDateFilter && dateFilter){

        const start = moment(dateFilter).format('YYYY-MM-DD')+'T00:00:00';
        const end = moment(dateFilter).format('YYYY-MM-DD')+'T23:59:59';

        response = await wp.posts()
          .embed()
          .perPage(100)
          .after(start)
          .before(end)
          .orderby('date')
          .order('desc')
          .get()

      }else{
        response = await wp.posts()
          .embed()
          .perPage(100)
          .orderby('date')
          .order('desc')
          .get()

      }

    }

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
