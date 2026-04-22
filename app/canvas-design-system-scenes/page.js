import { createClient } from "@/utils/supabase/server";
import ImageGeneration from "@/components/image-generation"
import { redirect } from 'next/navigation'
import { CanvasDesignSystem } from "@/components/canvas-design-system"
//import  TwoCanvasDesign  from "@/components/two-canvas-design-video-tracking-worker"
import  { Danva }  from "@/components/two-canvas-design-video-scenes"

//import  TwoCanvasDesign  from "@/components/two-canvas-design-video-tracking"
//import  TwoCanvasDesign  from "@/components/two-canvas-design"
//import  TwoCanvasDesign  from "@/components/two-canvas-design-bk-2"

//import  TwoCanvasDesign  from "@/components/two-canvas-design-bk-2025"


export default async function Page() {



  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();


  if (!user) {
    return redirect("/sign-in");
  }


  const userId = user.id

  return (
    <div style={{
      height: '100%',
      position: 'relative'
    }}>
      {/*}<ImageGeneration/>*/}
      {/*}<CanvasDesignSystem/>*/}
      <Danva  user={ user}/>

    </div>
  );
}
