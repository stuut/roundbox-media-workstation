import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

import PdfTextExtractor from '@/components/pdf-text-extractor'

import { getFeeds } from '@/lib/supabase'



export default async function Page() {
  const supabase = await createClient();


  const { data: { user } } = await supabase.auth.getUser();



  if (!user) {
    return redirect("/sign-in");
  }


  const userId = user.id

  const { data } = await supabase.from('feeds').select(`*`).eq('user_id', userId)

  console.log('data', data)



  return (
    <div style={{padding:'0px 25px'}}>
      <h2>Extract Pdf</h2>
      <div>
        <PdfTextExtractor user={user} feeds={data}/>
      </div>
    </div>
  );
}
