'use client'
import React, { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import axios from "axios";
import { showSuccess } from '@/lib/toast';
import { showError } from '@/lib/toast';
import { showInfo } from '@/lib/toast';
import moment from "moment";
var momentTZ = require('moment-timezone');




function NumToTime(num) {
  var hours = Math.floor(num / 60);
  var minutes = num % 60;
  if (minutes + ''.length < 2) {
    minutes = '0' + minutes;
  }
  return hours + ":" + minutes;
}

export const AddAChannel = ({userId}) =>{
  const supabase = createClient()

const [platform, setPlatform] = useState('One Signal')
const [externalAccountId, setExternalAccountId] = useState('')
const [name, setName] = useState('name')
const [accessToken, setAccessToken] = useState('')
const [pushPlatform, setPushPlatform] = useState('');
const [timeZone, setTimeZone] = useState(momentTZ.tz.guess());
const [timeZones, setTimeZones] = useState([]);
const [gmt, setGMT] = useState(NumToTime(moment.tz(momentTZ.tz.guess()).utcOffset()));
const [facebookPageId, setFacebookPageId] = useState('');


useEffect(() => {
  let zones = momentTZ.tz.names();
  let array = []
  let keys = Object.keys(zones);
  keys.forEach((key) => {
    array.push(zones[key])
  });
   setTimeZones(array);

},[]);



const selectTimeZone = (data) => {
  let gmt = NumToTime(moment.tz(data).utcOffset())
  setGMT(gmt)
  setTimeZone(data)
}


async function pushChannelInfoDatabase() {

  let metaData

  if (platform === 'One Signal'){
    metaData={
      push_platform:pushPlatform,
      time_zone:timeZone,
      gmt:gmt,
      facebook_page_id:facebookPageId
    }
  }


  try {
    await supabase.from('platform_accounts').upsert({
      user_id: userId,
      platform: platform,
      external_account_id: externalAccountId,
      name: name,
      access_token:accessToken,
      metadata: metaData
    })

    showSuccess('New Channel Added')
  } catch (err) {
    console.log('Supabase insert error', err.message);
    showError(err.message);
  }
}

const handleSubmit = (e) => {
   e.preventDefault();
  pushChannelInfoDatabase()
}






return(
  <div>
    <form onSubmit={handleSubmit}>
      <div style={{margin:'10px 0px'}}>
        <p className='label'>Plaform</p>
        <input
          required
          id="platform"
          type='text'
          value={platform}
          onChange={(e)=>setPlatform(e.target.value)}
          className={'form-input'}
        />
      </div>
      <div style={{margin:'10px 0px'}}>
        <p className='label'>Account Id</p>
        <input
          required
          id="external_account_id"
          type='text'
          value={externalAccountId}
          onChange={(e)=>setExternalAccountId(e.target.value)}
          className={'form-input'}
        />
      </div>
      <div style={{margin:'10px 0px'}}>
        <p className='label'>Name</p>
        <input
          required
          id="name"
          type='text'
          value={name}
          onChange={(e)=>setName(e.target.value)}
          className={'form-input'}
        />
      </div>
      <div style={{margin:'10px 0px'}}>
        <p className='label'>Access Token</p>
        <input
          required
          id="access_token"
          type='text'
          value={accessToken}
          onChange={(e)=>setAccessToken(e.target.value)}
          className={'form-input'}
        />
      </div>
      {platform === 'One Signal' &&
        <>
        <p className='label'>App Platform</p>
        <select style={{marginBottom: '10px'}}
          onChange={(e) => setPushPlatform(e.target.value)}
          value={pushPlatform}
          className={'form-input select'} required>
          <option value=''>Choose a App platform</option>
            <option value='web'>Web</option>
            <option value='mobile'>Mobile</option>
        </select>
        <p className='label'>Time Zone</p>
        <select
          onChange={(e) => selectTimeZone(e.target.value)}
          value={timeZone}
          className={'form-input select'} required>
          <option defaultValue value={momentTZ.tz.guess()}>{momentTZ.tz.guess()}</option>
          {timeZones.map((zone, index) =>
            <option key={index} value={zone}>{zone}</option>
          )};
        </select>
        <div style={{margin:'10px 0px'}}>
          <p className='label'>Facebook Page Id</p>
          <input
            id="facebook_page_id"
            type='text'
            value={facebookPageId}
            onChange={(e)=>setFacebookPageId(e.target.value)}
            className={'form-input'}
          />
        </div>
      </>
      }
      <button type="submit" className="btn primary" >SAVE</button>
    </form>
  </div>
)
}
