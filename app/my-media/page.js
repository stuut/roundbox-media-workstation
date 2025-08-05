import { createClient } from "@/utils/supabase/server";
import MyFiles from "@/components/my-files"
import MyFilesPageComponent from "@/components/my-files-page"

export default async function Page() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }


  const userId = user.id

  return (
    <div style={{padding:'25px'}}>
      <h2>My Media</h2>
      <div>
        <MyFilesPageComponent/>
      </div>
    </div>
  );
}
