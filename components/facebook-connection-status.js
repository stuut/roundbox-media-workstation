'use client'
import React, { useEffect, useState, useCallback } from 'react'
import axios from "axios";


export const FacebookConnectionStatus = ({userId}) => {


const refreshToken = (user_access_token) => {

  const app_id = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
  const app_secret = process.env.NEXT_PUBLIC_FACEBOOK_APP_SECRET;

  axios
    .get(
      API_URL +
        "/oauth/access_token?grant_type=fb_exchange_token&client_id=" +
        app_id +
        "&client_secret=" +
        app_secret +
        "&fb_exchange_token=" +
        user_access_token
    )
    .then (async(response) => {

      const { data, error } = await supabase
        .from('facebook_api') // your Supabase table name
        .update({
          access_token : response.data.access_token
        })
        .eq('user_id', userId)

      if (error) throw error;

    })

}




  useEffect(() => {
    window.FB.getLoginStatus((authResponse) => {

        if (authResponse.status === 'connected') {
          

        } else {
            console.log('User is not logged in.');
        }
    });
  },[]);


return null

}
