import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import CreateWorkspace from "@/components/create-workspace";
import MyWorkspaces from "@/components/my-workspaces";
import Chat from "@/components/chat";


export default async function ProtectedPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }


  const userId = user.id

  return (
    <div style={{padding:'15px'}}>
      <h2>Dashboard</h2>
      <div className='dashboard-layout'>
        <div>
          <CreateWorkspace userId={user.id}/>
        </div>
        <div>
          <MyWorkspaces userId={user.id}/>
        </div>
      {/*}<Chat/>*/}
      </div>
    </div>
  );
}
