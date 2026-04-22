import { createClient } from "@/utils/supabase/server";
import Board from "@/components/board";
import { redirect } from 'next/navigation'

export default async function WorkspacePage({ params }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  const { boardId } = await params
  const userId = user.id

  return (
    <>
      <style dangerouslySetInnerHTML={{
                    __html: `
                        body {
                          overflow-y:hidden;
                        }

                        `,
                  }}
                />
      <Board boardId={boardId} userId={userId}/>
    </>
  );
}
