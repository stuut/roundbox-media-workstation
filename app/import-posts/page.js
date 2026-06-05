import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { PostImporter } from '@/components/post-importer'
import { DemoApp } from '@/components/calendar-sample'



export default async function Page() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }


  const userId = user.id

  return (
    <div style={{padding:'25px', height:'100%'}}>
      {/*}<DemoApp user={user}/>*/}
      <PostImporter user={user}/>
    </div>
  );
}
