import { createClient } from "@/utils/supabase/server";
import FacebookMarketing from "components/facebook-marketing"
import { redirect } from 'next/navigation'


export default async function Page() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }


  const userId = user.id

  return (
    <div style={{padding:'25px'}}>
      <FacebookMarketing userId={userId}/>
    </div>
  );
}
