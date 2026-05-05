import AccountForm from '@/components/account-form'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Notifications from '@/components/notifications'
import AccountMenu from '@/components/account-menu'
import { AddAChannel } from '@/components/add-a-channel'




export default async function Channels() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()


  if (!user) {
    return redirect("/sign-in")
  }

  return (
        <div style={{display:'flex'}}>
          <div style={{padding:'25px'}}>
          <AccountMenu/>
          </div>
          <div style={{padding:'25px'}}>
            <AddAChannel userId={user.id}/>
          </div>
        </div>
      )
}
