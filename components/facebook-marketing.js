'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { getFacebookAccessToken } from "@/lib/supabase";
import { showSuccess } from '@/lib/toast';
import { showError } from '@/lib/toast';
import { showInfo } from '@/lib/toast';
import { useItemContext } from "@/context/item-context"


export default function facebookMarketing({ userId }) {
  const { setDisplayImportItems, setDisplayImportItemsData } = useItemContext();

  const [ facebookAccessToken, setFacebookAccessToken] = useState(null)
  const [ facebookAccounts, setFacebookAccounts] = useState([])
  const [ facebookAccountAds, setFacebookAccountAds] = useState([])
  const [ activeAccount, setActiveAccount] = useState(null)

  const [ selectedAds, setSelectedAds] = useState([])
  const [ selectedAdsJson, setSelectedAdsJson] = useState([])
  const [ response, setResponse] = useState([])



const getFacebookApiData = async() => {
  const FacebookAccessTokenData = await getFacebookAccessToken(userId)
  setFacebookAccessToken(FacebookAccessTokenData.access_token)

}


useEffect(()=>{

  if (facebookAccessToken){
    getFacebookAds()
  }

},[facebookAccessToken])


useEffect(()=>{

  if (userId){
    getFacebookApiData()
  }

},[userId])


const getFacebookAds = () => {

    window.FB.api(
    '/me/adaccounts',
    'GET',
    {
      access_token : facebookAccessToken,
    },
    function(response) {
        console.log(response)
        setFacebookAccounts(response.data)
    }
  );
}


const getAccountAds = (accountId) => {


  window.FB.api(
    `/${accountId}/ads`,
    'GET',
    {
      "fields":"name,status,adcreatives{image_url,object_story_spec}",
      access_token : facebookAccessToken,
    },
    function(response) {
        // Insert your code here
        console.log('response.data)', response.data)
        setFacebookAccountAds(response.data)
    }
  );

}

const getAdSetInfo = (adSetId) => {
  return new Promise((resolve, reject) => {
      window.FB.api(
      `/${adSetId}`,
      'GET',
      {
        fields: 'bid_strategy,bid_amount,effective_status',
        access_token: facebookAccessToken
      },
      function (response) {
          resolve(response);
      }
    );
  })
}






const getAdInsights = (ad) => {

  return new Promise((resolve, reject) => {
    window.FB.api(
    `/${ad.id}/insights`,
    'GET',
    {
      fields:"adset_id, account_name, ad_name, ad_id, clicks,spend,impressions,reach,cpc,ctr,actions,buying_type",
      date_preset: 'maximum',
      access_token : facebookAccessToken,


  },
    function(response) {
        resolve(response);
        // Insert your code here
    }
  );
})

}

const selectAd = async(ad, adInsights) => {

  if (!adInsights){
    showError('No data available')
    return
  }

  if (isAdSelected(ad, selectedAds)){
      setSelectedAds(prev  => prev.filter((prevAd)=> prevAd.id !== ad.id))
      setSelectedAdsJson(prev  => prev.filter((prevAd)=> prevAd.ad_id !== ad.id))

  }else{
    setSelectedAds(prev  => [...prev, ad])
    setSelectedAdsJson(prev  => [...prev, adInsights])

  }
}

useEffect(()=>{

  console.log('selectedAdsJson', selectedAdsJson)
},[selectedAdsJson])

const isAdSelected = (ad, array) => {

  return array.some((arr)=> {
    return arr.id === ad.id
  })
}

const prompt = "Which of these ads performed the best overall, and why?";

const getfeedback = async() => {

  const ads = selectedAdsJson

  const res = await fetch("/api/analyze-ads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ads, prompt }),
  });

  const data = await res.json();
  console.log(data.result);
  setResponse(prev => [...prev, data.result])
}

const importItems = () => {
  const dataArray = sampleData.map((item, index)=>{
    const newObject = {...item}
    if (!newObject.id){
      newObject.id = newObject.ad_id
    }
    return newObject
  })

  console.log('dataArray', dataArray)

  setDisplayImportItems(true)




  setDisplayImportItemsData(dataArray)
}

const sampleData=[
    {
        "adset_id": "6738822640031",
        "account_name": "Debra Clarke",
        "ad_name": "Website visitors Ad: Get ready for the concert that will rock the...",
        "ad_id": "6738822640831",
        "clicks": "923",
        "spend": "246.03",
        "impressions": "74300",
        "reach": "43175",
        "cpc": "0.266555",
        "ctr": "1.242261",
        "actions": [
            {
                "action_type": "page_engagement",
                "value": "7118"
            },
            {
                "action_type": "post_engagement",
                "value": "7113"
            },
            {
                "action_type": "onsite_conversion.post_save",
                "value": "2"
            },
            {
                "action_type": "comment",
                "value": "1"
            },
            {
                "action_type": "post",
                "value": "6"
            },
            {
                "action_type": "like",
                "value": "5"
            },
            {
                "action_type": "video_view",
                "value": "6550"
            },
            {
                "action_type": "post_reaction",
                "value": "42"
            },
            {
                "action_type": "link_click",
                "value": "512"
            }
        ],
        "buying_type": "AUCTION",
        "date_start": "2025-04-21",
        "date_stop": "2025-05-30"
    },
    {
        "adset_id": "6698217418031",
        "account_name": "Debra Clarke",
        "ad_name": "Instagram post: Orange! 🍊 Cap off an epic Orange...",
        "ad_id": "6698217434431",
        "clicks": "155",
        "spend": "103.27",
        "impressions": "10781",
        "reach": "6269",
        "cpc": "0.666258",
        "ctr": "1.437715",
        "actions": [
            {
                "action_type": "page_engagement",
                "value": "1604"
            },
            {
                "action_type": "post_engagement",
                "value": "1604"
            },
            {
                "action_type": "onsite_conversion.post_save",
                "value": "2"
            },
            {
                "action_type": "post",
                "value": "14"
            },
            {
                "action_type": "video_view",
                "value": "1439"
            },
            {
                "action_type": "post_reaction",
                "value": "12"
            },
            {
                "action_type": "link_click",
                "value": "137"
            }
        ],
        "buying_type": "AUCTION",
        "date_start": "2025-03-27",
        "date_stop": "2025-05-02"
    },
    {
        "adset_id": "6661788038631",
        "account_name": "Debra Clarke",
        "ad_name": "HGS Cohuna TV Ad",
        "ad_id": "6661788042431",
        "clicks": "533",
        "spend": "249.98",
        "impressions": "75015",
        "reach": "19033",
        "cpc": "0.469006",
        "ctr": "0.710525",
        "actions": [
            {
                "action_type": "onsite_conversion.total_messaging_connection",
                "value": "6"
            },
            {
                "action_type": "page_engagement",
                "value": "31251"
            },
            {
                "action_type": "post_engagement",
                "value": "31250"
            },
            {
                "action_type": "onsite_conversion.post_save",
                "value": "2"
            },
            {
                "action_type": "comment",
                "value": "2"
            },
            {
                "action_type": "onsite_conversion.messaging_user_depth_2_message_send",
                "value": "2"
            },
            {
                "action_type": "post",
                "value": "18"
            },
            {
                "action_type": "onsite_conversion.messaging_user_depth_3_message_send",
                "value": "4"
            },
            {
                "action_type": "onsite_conversion.messaging_user_depth_5_message_send",
                "value": "5"
            },
            {
                "action_type": "like",
                "value": "1"
            },
            {
                "action_type": "onsite_conversion.messaging_conversation_replied_7d",
                "value": "1"
            },
            {
                "action_type": "onsite_conversion.messaging_conversation_started_7d",
                "value": "1"
            },
            {
                "action_type": "video_view",
                "value": "31122"
            },
            {
                "action_type": "post_reaction",
                "value": "34"
            },
            {
                "action_type": "link_click",
                "value": "72"
            }
        ],
        "buying_type": "AUCTION",
        "date_start": "2025-02-14",
        "date_stop": "2025-04-06"
    },
    {
        "adset_id": "6652864987231",
        "account_name": "Debra Clarke",
        "ad_name": "Cohuna Home Ground Post 2025",
        "ad_id": "6652864987431",
        "clicks": "60",
        "spend": "149.58",
        "impressions": "87558",
        "reach": "29050",
        "cpc": "2.493",
        "ctr": "0.068526",
        "actions": [
            {
                "action_type": "page_engagement",
                "value": "36"
            },
            {
                "action_type": "post_engagement",
                "value": "36"
            },
            {
                "action_type": "link_click",
                "value": "36"
            }
        ],
        "buying_type": "AUCTION",
        "date_start": "2025-02-02",
        "date_stop": "2025-03-16"
    },
    {
        "adset_id": "6644201893831",
        "account_name": "Debra Clarke",
        "ad_name": "Post: \"Home Ground Sounds is in Cowra.\"",
        "ad_id": "6644201894231",
        "clicks": "167",
        "spend": "49.99",
        "impressions": "2836",
        "reach": "995",
        "cpc": "0.299341",
        "ctr": "5.888575",
        "actions": [
            {
                "action_type": "onsite_conversion.total_messaging_connection",
                "value": "13"
            },
            {
                "action_type": "onsite_conversion.messaging_block",
                "value": "2"
            },
            {
                "action_type": "page_engagement",
                "value": "708"
            },
            {
                "action_type": "post_engagement",
                "value": "706"
            },
            {
                "action_type": "comment",
                "value": "4"
            },
            {
                "action_type": "onsite_conversion.messaging_user_depth_2_message_send",
                "value": "8"
            },
            {
                "action_type": "onsite_conversion.messaging_first_reply",
                "value": "9"
            },
            {
                "action_type": "post",
                "value": "11"
            },
            {
                "action_type": "onsite_conversion.messaging_user_depth_3_message_send",
                "value": "7"
            },
            {
                "action_type": "onsite_conversion.messaging_welcome_message_view",
                "value": "42"
            },
            {
                "action_type": "onsite_conversion.messaging_user_depth_5_message_send",
                "value": "3"
            },
            {
                "action_type": "like",
                "value": "2"
            },
            {
                "action_type": "onsite_conversion.messaging_conversation_replied_7d",
                "value": "6"
            },
            {
                "action_type": "onsite_conversion.messaging_conversation_started_7d",
                "value": "9"
            },
            {
                "action_type": "video_view",
                "value": "646"
            },
            {
                "action_type": "post_reaction",
                "value": "17"
            },
            {
                "action_type": "link_click",
                "value": "28"
            }
        ],
        "buying_type": "AUCTION",
        "date_start": "2025-01-23",
        "date_stop": "2025-02-25"
    }
]




return(
    <div>
        <h2>Facebook Ads</h2>
        {facebookAccessToken &&
          <>
            <div>
              <h3><strong>Facebook Ad Accounts</strong></h3>
              {sampleData.length>0&&
                <button className="btn primary" onClick={importItems}>Import Items</button>
              }
              {selectedAdsJson.length>0&&
                <button className="btn primary" onClick={getfeedback}>getfeedback</button>
              }
              {selectedAdsJson.map((ad, index)=>{
                return(
                  <div key={index}>
                    {ad.ad_id}
                  </div>
                )
              })}
            </div>


              <div style={{display:'flex'}}>
                    <div style={{flex:1, padding:'10px'}}>
                      {facebookAccounts.map((account)=>{
                        return(
                          <div className={`card ad-card ${activeAccount === account.id?'active':'' }`} onClick={() => {
                            setActiveAccount(account.id)
                            getAccountAds(account.id)
                          }} key={account.id}>
                            {account.id}
                          </div>
                        )
                      })}
                    </div>
                    <div style={{flex:3, flexFlow: 'wrap', display:'flex', padding:'10px'}}>
                        {facebookAccountAds.map((ad)=>{
                          return(

                                <FacebookAd key={ad.id} ad={ad} facebookAccessToken={facebookAccessToken} selectedAds={selectedAds} selectAd={selectAd}/>

                          )
                        })}
                    </div>
            </div>


          </>
        }
    </div>
  )
}

export const FacebookAd = ({ad, facebookAccessToken, selectedAds, selectAd}) => {


  const [adData, setAdData] = useState(ad)
  const [adSetInfo, setAdSetInfo ] = useState(null)
  const [adInsights, setAdInsights ] = useState(null)

  const isAdSelected = (ad, array) => {

    return array.some((arr)=> {
      return arr.id === ad.id
    })
  }

  const getAdSetInfo = (adSetId) => {
    return new Promise((resolve, reject) => {
        window.FB.api(
        `/${adSetId}`,
        'GET',
        {
          fields: 'bid_strategy,bid_amount,effective_status',
          access_token: facebookAccessToken
        },
        function (response) {
            resolve(response);
        }
      );
    })
  }


  const getAdInsights = (ad) => {

    return new Promise((resolve, reject) => {
      window.FB.api(
      `/${ad.id}/insights`,
      'GET',
      {
        fields:"adset_id, account_name, ad_name, ad_id, clicks,spend,impressions,reach,cpc,ctr,actions,buying_type",
        date_preset: 'maximum',
        access_token : facebookAccessToken,

      },
        function(response) {
            resolve(response.data[0]);
            // Insert your code here
        }
      );
    })

  }


const getData = async() => {

  const adInsightsData = await getAdInsights(ad)
    console.log('adInsightsData', adInsightsData)

  if (adInsightsData){
    setAdInsights(adInsightsData)
    const adSetData = await getAdSetInfo(adInsightsData.adset_id)
    console.log('adSetData', adSetData)
    if (adSetData){
      setAdSetInfo(adSetData)
    }
  }

}


  useEffect(()=>{
    if(ad){
      setAdData(ad)
      getData()
    }

  },[ad])


  return(
    <>
      {adInsights &&
        <div style={{padding:'10px', width:'30%'}} onClick={() => selectAd(ad, adInsights)}>
          <div className={`card ad-card ${isAdSelected(ad, selectedAds)?'active':'' }`} style={{flex:1}}>
              <h3>{ad.name}</h3>
          </div>
        </div>
      }
    </>
  )
}
