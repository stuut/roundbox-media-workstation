import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import MyTasks from "@/components/my-tasks";


export default async function MyTasksPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }


  const userId = user.id

  return (
    <div style={{padding:'25px'}}>
      <h2>My Tasks</h2>
      <MyTasks userId={userId }/>
    </div>
  );
}
