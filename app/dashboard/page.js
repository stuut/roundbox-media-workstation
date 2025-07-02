import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import CreateWorkspace from "@/components/create-workspace";
import MyWorkspaces from "@/components/my-workspaces";
import Chat from "@/components/chat";
import CreateBoard from "@/components/create-board";
import MyBoards from "@/components/my-boards";
import CreateTask from "@/components/create-task";
import MyTasks from "@/components/my-tasks";


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
          <CreateBoard userId={user.id}/>
          <CreateTask userId={userId}/>
        </div>
        <div>
          <div style={{padding:'0px 10px'}}>
            <h2> Workspaces </h2>
            <MyWorkspaces userId={user.id}/>
          </div>
          <div style={{padding:'0px 10px'}}>
            <h2> Boards </h2>
            <MyBoards userId={userId }/>
          </div>
          <div style={{padding:'0px 10px'}}>
            <h2> Tasks </h2>
            <MyTasks userId={userId }/>
          </div>
          </div>
      </div>
    </div>
  );
}
