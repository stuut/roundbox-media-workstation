'use client';

import { useEffect, useState, useRef, useImperativeHandle, forwardRef } from 'react';
import { ChatConversations } from "@/components/chat-conversations"
import { useMessageListener } from '@/components/use-message-listener';
import { useUserContext } from '@/context/user-context'
import { createClient } from '@/utils/supabase/client'


export default function UserChat({}) {
  const [openChat, setOpenChat] = useState(false);
  const [alert, setAlert] = useState(false);
  const { user } = useUserContext();
  const supabase = createClient()
  const childRef = useRef(null);

  const handleTriggerChild = async (data) => {
    if (childRef.current) {
       childRef.current.childFunction(data); // ✅ Safe to call
    }
  };


useEffect(() => {

      const channel = supabase
        .channel(`messages`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
          },
          (payload) => {
            console.log('payload', payload)

            if (payload.new.sender_id !== user.id){
              setAlertFunction(true)

            }else{
              handleTriggerChild(payload.new)
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }, [user]);



const setAlertFunction = (data) => {

  if (!openChat){
    setAlert(true)
  }
}


  return (
    <div style={{
      position:'fixed',
      right:'5px',
      bottom:'5px',
      zIndex:1,
    }}>
      {alert&&
        <>
        <div
          className="primary"
          style={{
          width:'10px',
          height:'10px',
          position:'absolute',
          top:'0px',
          left:'0px',
          borderRadius:'50%'
          }}>
        </div>
        <div
          className="primary"
          style={{
          width:'10px',
          height:'10px',
          position:'absolute',
          top:'0px',
          left:'0px',
          borderRadius:'50%',
          animation: 'pulse 2s infinite'
          }}>
        </div>
      </>
      }
      {openChat&&
        <div className='card drop-shadow'
          style={{
            padding:'10px',
            position:'absolute',
            transform: 'translate(-100%, -100%)',
            minWidth: '600px',
            minHeight: '250px'
          }}>
          <ChatConversations ref={childRef} alert={setAlertFunction}/>
        </div>
      }
      <div
        onClick={() => {
          setOpenChat(prev => !prev)
          if (alert){
            setAlert(false)
          }
        }}
        style={{
          width:'60px',
          height:'60px',
          borderRadius:'50%',
          background:'#ffffff',
          padding: '10px'
        }}
      >
        <img src='/chat.svg'/>
      </div>
    </div>
  );
}
