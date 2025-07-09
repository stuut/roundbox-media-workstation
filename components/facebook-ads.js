'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { getFacebookAccessToken } from "@/lib/supabase";
import { showSuccess } from '@/lib/toast';
import { showError } from '@/lib/toast';
import { showInfo } from '@/lib/toast';


export default function facebookAds({ userId }) {
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

  console.log('accountId', accountId)


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

const selectAd = async(ad) => {

  const adData = await getAdInsights(ad)

  const adsetInfo = await getAdSetInfo(adData.adset_id)

  console.log('adData', adData)

  console.log('adsetInfo', adsetInfo)

  if (!adData.data.length>0){
    showError('No data available')
    return
  }

  if (isAdSelected(ad, selectedAds)){
      setSelectedAds(prev  => prev.filter((prevAd)=> prevAd.id !== ad.id))
      setSelectedAdsJson(prev  => prev.filter((prevAd)=> prevAd.ad_id !== ad.id))

  }else{
    setSelectedAds(prev  => [...prev, ad])
    setSelectedAdsJson(prev  => [...prev, adData.data[0]])

  }
}

useEffect(()=>{
  console.log(selectedAdsJson)
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




return(
    <div>
        <h2>Facebook Ads</h2>
        {facebookAccessToken &&
          <>
            <div>
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
                            <div key={ad.id} style={{padding:'10px', width:'30%'}} onClick={() => selectAd(ad)}>
                              <div className={`card ad-card ${isAdSelected(ad, selectedAds)?'active':'' }`} style={{flex:1}}>
                                  <h3>{ad.name}</h3>
                              </div>
                            </div>
                          )
                        })}
                    </div>
            </div>


          </>
        }
    </div>
  )
}
