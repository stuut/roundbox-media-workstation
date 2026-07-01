import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import PdfTextExtractor from '@/components/pdf-text-extractor'
import { getPublishFeeds } from '@/lib/supabase'



export default async function Page() {
  const supabase = await createClient();


  const { data: { user } } = await supabase.auth.getUser();



  if (!user) {
    return redirect("/sign-in");
  }


  const userId = user.id

  const data = await getPublishFeeds(userId)

  const feeds = data.map((feed)=>{
    return{
      ...feed,
      CTA_image:feed.files?.file_url
    }
  })

  return (
    <div style={{padding:'0px 25px', height:'100%'}}>
      <h2>Extract Pdf</h2>
        <PdfTextExtractor user={user} feeds={feeds}/>
    </div>
  );
}
