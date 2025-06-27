import { useEffect } from 'react';
import { createClient } from '@/utils/supabase/client'
const supabase = createClient()

export function useMessageListener(userId, onNewMessage) {
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        async (payload) => {
          const newMessage = payload.new;

          // Check if user is a member of the conversation
          const { data: members, error } = await supabase
            .from('conversation_members')
            .select('user_id')
            .eq('conversation_id', newMessage.conversation_id);

          if (error) {
            console.error('Error checking members:', error);
            return;
          }

          const isInConversation = members.some(m => m.user_id === userId);

          if (isInConversation) {
            onNewMessage(newMessage);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, onNewMessage]);
}
