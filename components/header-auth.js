import { signOutAction } from "@/app/actions"
import { hasEnvVars } from "@/utils/supabase/check-env-vars"
import Link from "next/link"
import { createClient } from "@/utils/supabase/server"
import SetUserInfo from "@/components/setUserInfo"
import UserHeader from "@/components/header-user"
import HeaderLinks from "@/components/header-links"
import User from "@/components/user"
import {FacebookConnectionStatus} from "@/components/facebook-connection-status"

import NotificationsProvider from "@/components/notications-provider"

export default async function AuthButton() {
  const supabase = await createClient()

  const {
    data: { user }
  } = await supabase.auth.getUser()


  if (!hasEnvVars) {
    return (
      <>
        <div>
          <div>
            <button
              style={{marginRight:"10px"}}
              className="btn primary"
              variant={"outline"}
              disabled
            >
              <Link href="/sign-in">Sign in</Link>
            </button>
            <button
              className="btn"
              variant={"default"}
              disabled
            >
              <Link href="/sign-up">Sign up</Link>
            </button>
          </div>
        </div>
      </>
    )
  }
  return user ? (
    <div style={{display:'flex', alignItems:'center', padding:'5px'}}>
      <SetUserInfo user={user}/>
      <NotificationsProvider user={user}/>
      {/*}<FacebookConnectionStatus userId={user.id}/>*/}
      <HeaderLinks/>
      <div style={{marginLeft:'auto', display:'flex', alignItems:'center'}}>
        <UserHeader user={user} />
        <form action={signOutAction}>
          <button className="btn danger">
            Sign out
          </button>
        </form>
      </div>
    </div>
  ) : (
    <div>
      <button style={{marginRight:"10px", marginLeft:'10px'}} className="btn primary">
        <Link href="/sign-in">Sign in</Link>
      </button>
      <button className="btn primary">
        <Link href="/sign-up">Sign up</Link>
      </button>
    </div>
  )
}
