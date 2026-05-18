export const uploadFile = async (file, tag, existingInfo, user) => {

  const formData = new FormData()
  formData.append('file', file)
  formData.append('tag', tag);

    try{
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const result = await res.json()

      if (res.ok) {

        const newFileData={
          ...existingInfo,
          file_url:result.url
        }

        const fileinfo = await storeFileInfo({
          user_id:user.id,
          file_url: newFileData.file_url,
          file_type:newFileData.file_type,
          file_name:newFileData.file_name,
          file_description:newFileData.file_description??null
        })

        const newFile={
          created_at: fileinfo.created_at,
          file_type: newFileData.file_type,
          file_url: newFileData.file_url,
          file_name:newFileData.file_name,
          file_description:newFileData.file_description??null,
          id: fileinfo.id,
          user_id: user.id
        }

        return newFile

      } else {
        showError(result.error)
      }
    }catch(error){
      console.log('file upload error', error)
    }

}
