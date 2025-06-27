import { createClient } from "@/utils/supabase/server";
import Board from "@/components/board";

export default async function WorkspacePage({ params }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  const { boardId } = await params
  const userId = user.id

  return (
      <Board boardId={boardId} userId={userId}/>
  );
}
