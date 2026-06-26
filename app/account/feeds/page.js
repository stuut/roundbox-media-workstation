import AccountForm from '@/components/account-form'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Notifications from '@/components/notifications'
import AccountMenu from '@/components/account-menu'
import { AddAFeed } from '@/components/add-a-feed'
import { feeds } from '@/components/feeds'




export default async function Feeds() {
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
            <Feeds userId={user.id}/>
            <AddAFeed userId={user.id}/>
          </div>
        </div>
      )
}
