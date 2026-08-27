import { storeFileInfo } from "@/lib/supabase";



export const convertBase64ToFile = (base64, mimeType, fileName) =>{

  const pureBase64 = base64.replace(/^data:.+;base64,/, '');
    
          // 2. Decode the Base64 string into binary text
     const binaryString = atob(pureBase64);
          
          // 3. Create a byte array from the binary text
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    return new File([bytes], `${fileName}${mimeType === 'image/jpeg'?'.jpg':'.png'}`, { type: mimeType });
}


export const uploadFile = async (file, tag, existingInfo, user) => {




  const formData = new FormData()
  formData.append('file', file)
  if (tag != null){
    formData.append('tag', tag);
  }
  
    try{
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const result = await res.json()

      if (res.ok) {


        const fileinfo = await storeFileInfo({
          user_id:user.id,
          file_url: result.url,
          file_type:file.type,
          file_name:file.name,
          file_description:existingInfo?.file_description??null
        })


        return{
          created_at: fileinfo?.created_at,
          file_type: fileinfo?.file_type,
          file_url: fileinfo?.file_url,
          file_name:fileinfo?.file_name,
          file_description:fileinfo?.file_description??null,
          id: fileinfo?.id,
          user_id: user?.id
        }


      } else {
        console.log('file upload error', result.error)
      }
    }catch(error){
      console.log('file upload error', error)
    }

}
