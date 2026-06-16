import { createClient } from "@/utils/supabase/server";
import dynamic from 'next/dynamic';

import PdfViewerComponent from '@/components/pdf-viewer-component'
import PdfTextExtractor from '@/components/pdf-text-extractor'



export default async function Page() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }


  const userId = user.id

  return (
    <div style={{padding:'0px 25px'}}>
      <h2>Extract Pdf</h2>
      <div>
        <PdfTextExtractor/>
      </div>
    </div>
  );
}
