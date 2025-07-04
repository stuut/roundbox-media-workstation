'use client';

import { useEffect, useState } from 'react';
import ChatConversations from "@/components/chat-conversations"

export default function UserChat({}) {
  const [openChat, setOpenChat] = useState(false);
  const [alert, setAlert] = useState(false);

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
          <ChatConversations alert={setAlertFunction}/>
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
