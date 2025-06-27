'use client';
import { useState, useEffect } from 'react';
import { useUserContext} from "@/context/user-context"

export default function SetUserInfo({user}) {
  const { setUser } = useUserContext();

  useEffect(() => {
    if (user){
      setUser(user)
    }

}, [user]);



  return (
    <div>
    </div>
  )
}
