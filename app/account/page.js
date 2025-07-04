import AccountForm from '@/components/account-form'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Notifications from '@/components/notifications'
import {FacebookConnection} from '@/components/connect-facebook'
export default async function Account() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
        <div className='col-3'>
          <div>
            <h3>Account Details</h3>
            <AccountForm user={user} />
          </div>
          <div>
            <h3>Notfications</h3>
            <Notifications userId={user.id} />
          </div>
          <div>
            <FacebookConnection userId={user.id}/>
          </div>
        </div>
      )
}
