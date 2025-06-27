import { createClient } from "@/utils/supabase/server";
import Workspace from "@/components/work-space";
import CreateBoard from "@/components/create-board";
import MyBoards from "@/components/my-boards";
import WorkspaceBoards from "@/components/workspace-boards";


export default async function WorkspacePage({ params }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  const { workspaceId } = await params
  const userId = user.id

  return (
      <div>
        <Workspace workspaceId={workspaceId} userId={userId}/>
      </div>
  );
}
