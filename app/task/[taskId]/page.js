import { createClient } from "@/utils/supabase/server";
import Task from "@/components/task";
import { redirect } from 'next/navigation'




export default async function TaskPage({ params }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  const { taskId } = await params
  const userId = user.id

  return (
    <>
      <Task taskId={taskId} userId={userId}/>
    </>
  );
}
