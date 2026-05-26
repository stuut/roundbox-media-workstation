import axios from "axios";
import { createClient } from "@/utils/supabase/server";

export async function GET(request) {

  try {

    const supabase = await createClient();

    const { data: tokens } = await supabase
      .from("facebook_api")
      .select("*");

      if (!tokens) {
        return Response.json({ message: "No Data" })
      }


      for (const token of tokens) {

        const user_access_token = token.access_token

        const app_id = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
        const app_secret = process.env.NEXT_PUBLIC_FACEBOOK_APP_SECRET;
        const API_URL = "https://graph.facebook.com/v18.0";

          const response= await axios.get(
              API_URL +
                "/oauth/access_token?grant_type=fb_exchange_token&client_id=" +
                app_id +
                "&client_secret=" +
                app_secret +
                "&fb_exchange_token=" +
                user_access_token
            )


            const expiresAt = Math.floor(Date.now() / 1000) + (60 * 24 * 60 * 60);

            const { data, error } = await supabase
              .from('facebook_api') // your Supabase table name
              .update({
                access_token : response.data.access_token,
                data_access_expiration_time: expiresAt,
                expires_in: expiresAt
              })
              .eq('user_id', token.user_id)

            if (error) throw error;

          const pagesRes = await axios.get(
            `${API_URL}/me/accounts`,
            {
              params: {
                access_token: response.data.access_token
              }
            }
          );

          //console.log('pagesRes.data', pagesRes.data.data)

          for (const account of pagesRes.data.data) {
            const { data, error } = await supabase
              .from('platform_accounts') // your Supabase table name
              .update({
                access_token : account.access_token
              })
              .eq('external_account_id', account.id)
          }

      }


    return Response.json({ message: `Facebook Tokens Updated` })

  } catch (err) {
    console.error(err)
    return new Response("error refreshing token", { status: 500 })
  }

}
