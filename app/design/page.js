import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import EditImage from '@/components/edit-image.js'



export default async function Page() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }


  const userId = user.id

  return (
    <div style={{padding:'25px', height:'100%'}}>
      <EditImage initialPath={'/sample-image.jpg'}/>
      <EditImage initialPath={'https://pub-d6323aeb43a84ab4a229b45727a1e7ee.r2.dev/1773639613262-harold.jpg'}/>

    </div>
  );
}
