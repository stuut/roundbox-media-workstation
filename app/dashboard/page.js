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
      <div className='dashboard-layout'>
        <div>
          <CreateWorkspace userId={user.id}/>
          <CreateBoard userId={user.id} accordionState={'open'}/>
          <CreateTask userId={userId} accordionState={'open'} />
        </div>
        <div style={{paddingTop:'25px'}}>
          <div className="border_card" style={{marginBottom:'25px'}}>
            <h2 style={{paddingLeft:'10px'}}> Workspaces </h2>
            <MyWorkspaces userId={user.id}/>
          </div>
          <div className="border_card" style={{marginBottom:'25px'}}>
            <h2 style={{paddingLeft:'10px'}}> Boards </h2>
            <MyBoards userId={userId }/>
          </div>
          <div className="border_card" style={{marginBottom:'25px'}}>
            <h2 style={{paddingLeft:'10px'}}> Tasks </h2>
            <MyTasks userId={userId }/>
          </div>
          </div>
      </div>
    </div>
  );
}
