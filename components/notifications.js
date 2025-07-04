'use client';
import { useState, useEffect } from 'react';
import { showSuccess } from '@/lib/toast';
import { showError } from '@/lib/toast';
import { showInfo } from '@/lib/toast';
import { getNotifications } from '@/lib/supabase'
import { deleteNotification } from '@/lib/supabase'


export default function Notifications({ userId }) {
  const [notifications, setNotifications] = useState([]);


  const getData = async () => {
    try {
        const notificationsData = await getNotifications(userId)
        console.log('notificationsData', notificationsData)
        setNotifications(notificationsData);
    } catch (error) {
      showError(error.message);
    }
  }

  const deleteNotfication = async (id) => {
    try{
      await deleteNotification(id)
      setNotifications(prev => prev.filter((notification)=> notification.id !== id))
      showSuccess('Notification deleted')
    }catch(error){
      showError(error)
    }



  }



  useEffect(() => {
    if (userId){
      getData()
    }

  }, [userId]);


  return(
    <div>
      {notifications.map((notification, index)=>{
        return(
          <div key={notification.id} className="notification" style={{marginBottom:'15px', position:'relative'}}>
            <div dangerouslySetInnerHTML={{__html: notification.message}}/>
            <div onClick={() => deleteNotfication(notification.id)} style={{position:'absolute', top:'7px', right:'7px'}}>
              <img src='/close-notification.svg' style={{width:'20px'}}/>
            </div>
          </div>
        )
      })}
    </div>
  )
}
