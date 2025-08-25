import AccountForm from '@/components/account-form'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Notifications from '@/components/notifications'
import {FacebookConnection} from '@/components/connect-facebook'
import AccountMenu from '@/components/account-menu'

export default async function Account() {
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
            <div>
              <h3>Notifications</h3>
              <Notifications userId={user.id} />
            </div>
          </div>
        </div>
      )
}
