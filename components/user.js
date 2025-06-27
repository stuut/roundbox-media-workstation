'use client'
import React, { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'




export default function User({size, userInfo, active}) {
  const [avatarUrl, setAvatarUrl] = useState(userInfo.avatar_url)

  useEffect(() => {
        setAvatarUrl(userInfo.avatar_url)
  }, [userInfo.avatar_url])


  return(
    <div style={{display:'flex', alignItems:'center'}}>
        <img style={{
        objectFit:'cover',
        width:size === 'small'? '25px':'50px',
        height:size === 'small'? '25px':'50px',
        borderRadius:'100%'
        }} src={avatarUrl ? avatarUrl : active?'/account-active.svg':'/account.svg'}/>
      <div style={{paddingLeft:'10px'}}>
        {userInfo.full_name}
    </div>
    </div>
  )
}
