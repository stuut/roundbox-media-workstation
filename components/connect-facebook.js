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


  async function logInToFB() {
    try {
      const loginResponse = await new Promise((resolve) => {
        window.FB.login(resolve, {
          scope: `
            read_insights,
            pages_show_list,
            ads_management,
            business_management,
            pages_messaging,
            pages_messaging_subscriptions,
            instagram_basic,
            instagram_manage_comments,
            instagram_manage_insights,
            instagram_content_publish,
            instagram_manage_contents,
            pages_read_engagement,
            pages_manage_metadata,
            pages_read_user_content,
            pages_manage_posts,
            pages_manage_engagement,
            public_profile,
            ads_read
          `
        });
      });

      setFacebookConnectionStatus(loginResponse.status);

      const auth = loginResponse.authResponse;
      if (!auth?.accessToken) {
        throw new Error("User did not authorize the app");
      }

      const shortLivedToken = auth.accessToken;
      setFbUserAccessToken(shortLivedToken);

      const API_URL = "https://graph.facebook.com/v3.2";

      // ⚠️ SHOULD BE DONE ON BACKEND
      const app_id = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
      const app_secret = process.env.NEXT_PUBLIC_FACEBOOK_APP_SECRET;

      // 1. Exchange token
      const tokenRes = await axios.get(
        `${API_URL}/oauth/access_token`,
        {
          params: {
            grant_type: "fb_exchange_token",
            client_id: app_id,
            client_secret: app_secret,
            fb_exchange_token: shortLivedToken
          }
        }
      );

      const longLivedToken =
        tokenRes.data.access_token || shortLivedToken;

      // 2. Store in Supabase
      const { error } = await supabase
        .from("facebook_api")
        .upsert(
          [
            {
              access_token: longLivedToken,
              data_access_expiration_time:
                auth.data_access_expiration_time || "",
              expires_in: auth.expiresIn || "",
              graph_domain: auth.graphDomain || "",
              signed_request: auth.signedRequest || "",
              facebook_user_id: auth.userID || "",
              user_id: userId
            }
          ],
          { onConflict: ["user_id", "facebook_user_id"] }
        );

      if (error) throw error;

      // 3. Get user ID
      const meRes = await axios.get(`${API_URL}/me`, {
        params: { access_token: longLivedToken }
      });

      const fbUserId = meRes.data.id;

      // 4. Get pages
      const pagesRes = await axios.get(
        `${API_URL}/${fbUserId}/accounts`,
        {
          params: { access_token: longLivedToken }
        }
      );

      // 5. Process pages
      FacebookDataSort(pagesRes.data.data);

    } catch (error) {
      console.error(error);
      showError(error.message || "Facebook login failed");
    }
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
        await supabase.from('platform_accounts').upsert(
          {
          user_id: userId,
          platform: 'facebook',
          external_account_id: account.id,
          name: account.name,
          access_token:account.access_token,
          metadata: {
            facebook_page_id: account.id,
            accountInfo:account
          }
        },
        {
           onConflict: 'user_id,external_account_id',
        }
      )
      } catch (err) {
        console.log('Supabase insert error (Facebook):', err.message);
        showError(err.message);
      }
    }

    async function pushToInstagramInfoDatabase(account, instagramBusinessAccountId) {
      try {
        await supabase.from('platform_accounts').upsert(
          {
          user_id: userId,
          platform: 'instagram',
          external_account_id: instagramBusinessAccountId,
          name: account.name,
          access_token:account.access_token,
          metadata: {
            facebook_page_id: account.id,
            instagram_business_account_id: instagramBusinessAccountId,
            accountInfo:account
          }
        },
        {
           onConflict: 'user_id, external_account_id',
        }
      )

      } catch (err) {
        console.log('Supabase insert error (Instagram):', err.message);
        showError(err.message);
      }
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
