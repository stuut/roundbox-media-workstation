'use client';
import { useState, useEffect } from 'react';
import { showInfo } from '@/lib/toast';
import { createClient } from '@/utils/supabase/client'
import { showSuccess } from '@/lib/toast';
import { showError } from '@/lib/toast';


export default function NotificationsProvider({user}) {

  const supabase = createClient()


  useEffect(() => {
    if (!user.id) return;

    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
            console.log('notifications', payload)
            showInfo(payload.new.message)
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user.id]);



  return(
    <div>
    </div>
  )
}
