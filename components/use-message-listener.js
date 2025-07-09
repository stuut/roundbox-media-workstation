import { useEffect } from 'react';
import { createClient } from '@/utils/supabase/client'
const supabase = createClient()

export function useMessageListener(userId, onNewMessage) {
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`messages-for-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          console.log('payload', payload)
          onNewMessage(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, onNewMessage]);
}
