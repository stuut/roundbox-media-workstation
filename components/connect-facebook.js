'use client'
import React, { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import axios from "axios";


export const FacebookConnection = ({userId}) => {
  const supabase = createClient()

  const [facebookConnectionStatus, setFacebookConnectionStatus] = useState();
  const [fbUserAccessToken, setFbUserAccessToken] = useState(null);


  // Logs out the current Facebook user
  const logOutOfFB = useCallback(() => {
    window.FB.logout(() => {
      setFbUserAccessToken(null);
      setFacebookConnectionStatus('unknown');
    });
  }, []);

  useEffect(() => {
    window.FB.getLoginStatus((authResponse) => {
        if (authResponse) {
          console.log('authResponse', authResponse)
          setFacebookConnectionStatus(authResponse.status)
        }
        if (authResponse.status === 'connected') {
                    window.FB.api('/me/permissions', (permissionsResponse) => {
                        console.log('User permissions:', permissionsResponse);
                    });
                } else {
                    console.log('User is not logged in.');
                }
    });
  },[]);


  async function rerequest(){
      window.FB.login((loginResponse) => {
      },{
        scope: 'pages_manage_engagement',
        auth_type: 'rerequest'
      })
  }


  async function logInToFB(){

      window.FB.login((loginResponse) => {
        setFacebookConnectionStatus(loginResponse.status);
        const app_id = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
        const app_secret = process.env.NEXT_PUBLIC_FACEBOOK_APP_SECRET;
        if(loginResponse.authResponse?.accessToken != null){

        let user_access_token = loginResponse.authResponse.accessToken
        setFbUserAccessToken(loginResponse.authResponse.accessToken);
        const API_URL = "https://graph.facebook.com/v3.2";
        let obj = { id: "", token: "" };
        var self = this;
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
          .then(response => {
            obj.token = response.data.access_token;
            return obj;
          })
          .then(obj => {
            axios
              .get(API_URL + "/me?access_token=" + obj.token)
              .then(response => {
                obj.id = response.data.id;
                return obj;
              })
              .then(obj => {
                axios
                  .get(
                    API_URL + "/" + obj.id + "/accounts?access_token=" + obj.token
                  )
                  .then(response => {

                      console.log('response.data.data', response.data.data)
                      FacebookDataSort(response.data.data)

                    }).catch((error) => {
                      console.log(error.message)
                      notifyError(error.message)

                  })
                  .catch(error => {
                      console.log(error.message)
                      notifyError(error.message)
                  });
              })
              .catch(error => {
                  console.log(error.message)
                  notifyError(error.message)
              });
          })
          .catch(function(error) {
            console.log(error.message)
            notifyError(error.message)
          });
        }

      },
      {
        scope: 'read_insights,pages_show_list,ads_management,business_management,pages_messaging,pages_messaging_subscriptions,instagram_basic,instagram_manage_comments,instagram_manage_insights,instagram_content_publish,pages_read_engagement,pages_manage_metadata,pages_read_user_content,pages_manage_posts,pages_manage_engagement,public_profile'
      })
}





  async function getInstagramBusinessAccountInfo(facebookPageId) {
        let promise = new Promise((resolve, reject) => {
                window.FB.api(
                  `/${facebookPageId}/`,
                  'GET',
                  {
                    "fields":"instagram_business_account"
                  },
                  function(response) {
                    resolve(response.instagram_business_account ? response.instagram_business_account.id :null)
                  }
                );
              });
          let result = await promise;
        return result;
      }




      async function pushTofacebookInfoDatabase(account, instagramBusinessAccountId) {
      try {
        const { data, error } = await supabase
          .from('facebook_accounts') // your Supabase table name
          .upsert([{
            facebook_page_id: account.id,
            facebook_page_name: account.name,
            access_token: account.access_token,
            instagram_business_account_id: instagramBusinessAccountId,
            connected_at: new Date().toISOString(),
            user_id:userId
          }], { onConflict: ['user_id', 'facebook_page_id'] });

        if (error) throw error;
        return data;
      } catch (err) {
        console.error('Supabase insert error (Facebook):', err.message);
        notifyError(err.message);
      }
    }

    async function pushToInstagramInfoDatabase(account, instagramBusinessAccountId) {
      try {
        const { data, error } = await supabase
          .from('instagram_accounts') // your Supabase table name
          .upsert([{
            facebook_page_id: account.id,
            connected_facebook_page_name: account.name,
            access_token: account.access_token,
            instagram_account_id: instagramBusinessAccountId,
            connected_at: new Date().toISOString(),
            user_id:userId
          }], { onConflict: ['user_id', 'instagram_account_id'] });

        if (error) throw error;
        return data;
      } catch (err) {
        console.error('Supabase insert error (Instagram):', err.message);
        notifyError(err.message);
      }
    }


  async function FacebookDataSort(data) {

      var promises = data.map(async function(account, index){
          let instagramBusinessAccountId = await getInstagramBusinessAccountInfo(account.id)
           pushToInstagramInfoDatabase(account, instagramBusinessAccountId)
           pushTofacebookInfoDatabase(account, instagramBusinessAccountId)
      });

      Promise.all(promises).then(function(results) {
      })

    }




  return(

    <div style={{padding:'15px', maxWidth:'900px', margin:'10px 0px 0px 0px'}}>
      <div  className = "bd-callout bd-callout-info">
      {facebookConnectionStatus === "connected" ? (
        <button onClick={logOutOfFB} className="btn btn-primary">
          Disconnect facebook
        </button>
      ) : (
        <>
        <button onClick={logInToFB} className="btn btn-primary">
          Connect Facebook
        </button>
        </>
      )}

      {facebookConnectionStatus &&
          <div>
              <div style={{marginTop:'10px'}}>Facebook connect status: {facebookConnectionStatus}</div>
          </div>
      }
      </div>
    </div>
  )
}
