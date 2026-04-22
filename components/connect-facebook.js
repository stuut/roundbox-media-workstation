'use client'
import React, { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import axios from "axios";
import { showSuccess } from '@/lib/toast';
import { showError } from '@/lib/toast';
import { showInfo } from '@/lib/toast';

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

          //
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
          .then (async(response) => {
            obj.token = response.data.access_token;

            const { data, error } = await supabase
              .from('facebook_api') // your Supabase table name
              .upsert([{
                access_token : response.data.access_token? response.data.access_token : loginResponse.authResponse.accessToken,
                data_access_expiration_time : loginResponse.authResponse.data_access_expiration_time ? loginResponse.authResponse.data_access_expiration_time : '',
                expires_in : loginResponse.authResponse.expiresIn ? loginResponse.authResponse.expiresIn : '',
                graph_domain : loginResponse.authResponse.graphDomain ? loginResponse.authResponse.graphDomain : '',
                signed_request : loginResponse.authResponse.signedRequest ? loginResponse.authResponse.signedRequest : '',
                facebook_user_id : loginResponse.authResponse.userID ? loginResponse.authResponse.userID : '' ,
                user_id:userId
              }], { onConflict: ['user_id', 'facebook_user_id'] });

            if (error) throw error;

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

                      FacebookDataSort(response.data.data)

                    }).catch((error) => {
                      console.log(error.message)
                      showError(error.message)

                  })
                  .catch(error => {
                      console.log(error.message)
                      showError(error.message)
                  });
              })
              .catch(error => {
                  console.log(error.message)
                  showError(error.message)
              });
          })
          .catch(function(error) {
            console.log(error.message)
            showError(error.message)
          });
        }

      },
      {
        scope: 'read_insights,pages_show_list,ads_management,business_management,pages_messaging,pages_messaging_subscriptions,instagram_basic,instagram_manage_comments,instagram_manage_insights,instagram_content_publish,pages_read_engagement,pages_manage_metadata,pages_read_user_content,pages_manage_posts,pages_manage_engagement,public_profile, ads_read, ads_management'
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


      async function pushTofacebookInfoDatabase(account) {
      try {
        await supabase.from('platform_accounts').upsert({
          user_id: userId,
          platform: 'facebook',
          external_account_id: account.id,
          name: account.name,
          metadata: {
            facebook_page_id: account.id,
            accountInfo:account
          }
        })
      } catch (err) {
        console.log('Supabase insert error (Facebook):', err.message);
        showError(err.message);
      }
    }

    async function pushToInstagramInfoDatabase(account, instagramBusinessAccountId) {
      try {
        await supabase.from('platform_accounts').upsert({
          user_id: userId,
          platform: 'instagram',
          external_account_id: instagramBusinessAccountId,
          name: account.name,
          metadata: {
            facebook_page_id: account.id,
            instagram_business_account_id: instagramBusinessAccountId,
            accountInfo:account
          }
        })

      } catch (err) {
        console.log('Supabase insert error (Instagram):', err.message);
        showError(err.message);
      }
    }



  async function pushInfoDatabase(account, instagramBusinessAccountId){
    await supabase.from('platform_accounts').upsert({
      user_id: userId,
      platform: instagramBusinessAccountId ? 'instagram' : 'facebook',
      external_account_id: instagramBusinessAccountId ?? account.id,
      name: account.name,
      metadata: {
        facebook_page_id: account.id,
        instagram_business_account_id: instagramBusinessAccountId
      }
    })
  }





  async function FacebookDataSort(data) {
      var promises = data.map(async function(account, index){
          let instagramBusinessAccountId = await getInstagramBusinessAccountInfo(account.id)

          if (instagramBusinessAccountId){
               pushToInstagramInfoDatabase(account, instagramBusinessAccountId)
          }

           pushTofacebookInfoDatabase(account)
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
