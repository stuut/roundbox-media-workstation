import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import MyBoards from "@/components/my-boards";


export default async function MyBoardsPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }


  const userId = user.id

  return (
    <div style={{padding:'25px'}}>
      <h2>My Boards</h2>
      <MyBoards userId={userId }/>
    </div>
  );
}
