'use client'
import React, { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { getUser } from '@/lib/supabase'
import Link from "next/link"




export default function UserHeader({user}) {


  const [avatarUrl, setAvatarUrl] = useState(null)
  const [userInfo, setUserInfo] = useState(null)


  const getUserInfo = async (userId) => {
      const userData = await getUser(userId)
      if (userData.avatar_url){
        setAvatarUrl(userData.avatar_url)
      }
  }


  useEffect(() => {

    if (user){
      getUserInfo(user.id)
    }

  }, [user])


  return(
    <Link style={{marginRight:'10px'}} href='/account'>
      <div style={{display:'flex', alignItems:'center'}}>
          <img style={{objectFit:'cover', width:'50px', height:'50px', borderRadius:'100%'}} src={avatarUrl ? avatarUrl :'/account.svg'}/>
      </div>
    </Link>
  )
}
