import { createClient } from "@/utils/supabase/server";
import ImageGeneration from "@/components/image-generation"
import { redirect } from 'next/navigation'
import { CanvasDesignSystem } from "@/components/canvas-design-system"
import { Danva }  from "@/components/two-canvas-design-video-scenemanager"
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
        <div style={{
          height: '100%',
          position: 'relative'
        }}>
          {/*}<ImageGeneration/>*/}
          {/*}<CanvasDesignSystem/>*/}
          <Danva  user={ user} feeds={feeds}/>

        </div>

  );
}
