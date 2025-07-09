import { createClient } from "@/utils/supabase/server";
import FacebookAds from "components/facebook-ads"
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
      <FacebookAds userId={userId}/>
    </div>
  );
}
