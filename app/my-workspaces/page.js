import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import MyWorkspaces from "@/components/my-workspaces";
import CreateWorkspace from "@/components/create-workspace";


export default async function MyWorkspacesPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  const userId = user.id
  return (
    <div style={{padding:'15px'}}>
      <h2>My Workspaces</h2>
      <div className='dashboard-layout'>
        <div>
          <CreateWorkspace userId={userId} titleSize={"large"} accordionState={'open'}/>
        </div>
        <div>
          <MyWorkspaces userId={userId}/>
        </div>
      {/*}<Chat/>*/}
      </div>
    </div>
  );
}
