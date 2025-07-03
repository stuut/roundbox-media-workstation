import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import MyBoards from "@/components/my-boards";
import CreateBoard from "@/components/create-board";


export default async function MyBoardsPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }


  const userId = user.id

  return (
    <div style={{padding:'25px'}}>
      <h1>My Boards</h1>
      <div className='board-layout'>
        <div>
          <CreateBoard userId={user.id}/>
        </div>
        <div>
          <MyBoards userId={userId }/>
        </div>
      </div>
    </div>
  );
}
