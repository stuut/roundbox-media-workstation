import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Scheduler } from '@/components/scheduler'
import { DemoApp } from '@/components/calendar-sample'
import { getFeeds } from '@/lib/supabase'


export default async function Page() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }


  const userId = user.id

  const data = await getFeeds(userId)


  const feeds = data.map((feed)=>{
    return{
      ...feed,
      CTA_image:feed.files?.file_url
    }
  })

  return (
    <div style={{padding:'25px', height:'100%'}}>
      {/*}<DemoApp user={user}/>*/}
      <Scheduler user={user} feeds={feeds}/>
    </div>
  );
}
