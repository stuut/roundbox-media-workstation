'use client';
import { useState, useEffect } from 'react';
import { useFilesContext } from "@/context/files-context"
import { useUserContext } from "@/context/user-context"
import { isObjectInArray } from '@/lib/utils'
import { getFiles } from "@/lib/supabase";
import ImageGeneration from "components/image-generation"
import VideoGeneration from "components/video-generation"
import DisplayVideo from "components/display-video"

import { storeFileInfo } from "@/lib/supabase";
import { deleteFiles } from "@/lib/supabase";
import { showSuccess } from '@/lib/toast';
import { showError } from '@/lib/toast';
import { showInfo } from '@/lib/toast';

export default function MyFiles() {
  const { user } = useUserContext();
  const { showFiles, setShowFiles, files, setFiles, selectedFiles, setSelectedFiles, filePicker} = useFilesContext();
  const [userId, setUserId] = useState(null)
  const [filesDisplay, setFilesDisplay] = useState('My Files')
  const [uploading, setUploading] = useState(false)


  const getData = async (userId) => {
    try {
      const myFiles = await getFiles(userId);
      setFiles(myFiles);
    } catch (error) {
      console.log('error getting files', error);
    }
  };

  useEffect(() => {
    if (user){
      //setUserId(user.id)
      getData(user.id)
    }

}, [user]);


const selectFileFunction = (data) => {

  if (isObjectInArray(data, selectedFiles)){
    setSelectedFiles(prev => prev.filter(remove => remove.id !== data.id));

  }else{
    setSelectedFiles(selectedFiles => [...selectedFiles, data])
  }

}

const uploadFile = async (event) => {
  try {
    setUploading(true)

    if (!event.target.files || event.target.files.length === 0) {
      throw new Error('You must select an image to upload.')
    }

    const file = event.target.files[0];
    const fileExt = file.name.split('.').pop();
    const filePath = `${user.id}/${Math.random()}.${fileExt}`;
    const fileType = file.type;
    const fileName = file.name
    const formData = new FormData()
    formData.append('file', file)

    try{
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const result = await res.json()

      if (res.ok) {

        const fileData={
          file_url:result.url,
          file_type:fileType,
          file_name:fileName
        }
        handleFileFunction(fileData)
      } else {
        showError(result.error)
      }
    }catch(error){
      console.log('file upload error', error)
    }

  } catch (error) {
    console.log(error)
    alert('Error uploading image!')
  } finally {
    setUploading(false)
  }
}

const handleFileFunction = async (data) => {
  try{
    const fileinfo = await storeFileInfo({
      user_id:user.id,
      file_url: data.file_url,
      file_type:data.file_type,
      file_name:data.file_name
    })

    const newFile={
      created_at: fileinfo.created_at,
      file_type: data.file_type,
      file_url: data.file_url,
      file_name:data.file_name,
      id: fileinfo.id,
      user_id: user.id
    }

  setFiles(prev => [...prev, newFile]);


  }catch (error){
    console.log('Error updating task due date: ', error)
  }
}

const deleteSelectedFiles = async () => {


  const fileIds = selectedFiles.map((file)=>{
    return file.id
  })

  for (let i = 0; i < selectedFiles.length; i++) {
    try{
      await fetch('/api/delete-file', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: selectedFiles[i].file_url }),
      })

    }catch(error){
      showError(error)
    }

  }

  await deleteFiles(fileIds);

  setFiles(prev =>
    prev.filter((file)=> !selectedFiles.some((selectedFile) => selectedFile.id === file.id))
  )

  setSelectedFiles([])

  showSuccess('Files Deleted')

}

  return (
    <>
      {showFiles&&
        <div className='overlay' onClick={(e) => setShowFiles(false)}>
          <div className='center-absolute' style={{width:'100%', maxWidth:'900px'}}>
            <div className="card" onClick={(e) => e.stopPropagation()}>
              <div style={{display:'flex', padding:'15px'}}>
                <div style={{flex:1, flexDirection:'column', display:'flex'}}>
                  <button onClick={() => setFilesDisplay('My Files')} className={`${'btn'} ${filesDisplay ==='My Files'?'primary':'secondary'}`}>My files</button>
                  <button style={{marginTop:'10px'}} onClick={() => setFilesDisplay('Gemini')} className={`${'btn'} ${filesDisplay ==='Gemini'?'primary':'secondary'}`}>Gemini</button>
                  <button style={{marginTop:'10px'}} onClick={() => setFilesDisplay('Video')} className={`${'btn'} ${filesDisplay ==='Video'?'primary':'secondary'}`}>Veo</button>

            </div>
                <div style={{flex:3, padding:'15px', overflowY: 'scroll', maxHeight: '800px'}}>
                  {(filesDisplay ==='My Files' || filesDisplay ==='Gemini') &&
                    <div>
                      <div style={{display:'flex', alignItems:'center'}}>
                        <input
                          style={{marginBottom:'10px'}}
                          type="file"
                          id="single"
                          accept="image/*,.pdf,.doc"
                          onChange={uploadFile}
                          disabled={uploading}
                        />
                        {selectedFiles.length>0 &&
                          <button style={{marginLeft:'10px'}} className='btn danger' onClick={deleteSelectedFiles}>Delete Files</button>
                        }
                      </div>
                    <div style={{display:'flex', flexDirection:'row',  flexWrap: 'wrap'}}>
                      {files.map((file, index)=>{
                        return (
                          <div key={file.id} style={{width:'18%', margin:'1%'}}>
                            <div>
                              {(file.file_type === 'image/png' || file.file_type === 'image/jpeg')&&
                                <img className={`${'media-image'} ${isObjectInArray(file, selectedFiles)?'active':''}`} onClick={() => selectFileFunction(file) } src={file.file_url}/>
                              }
                              {file.file_type === 'application/pdf'&&
                                <>
                                  <img className={`${'media-file'} ${isObjectInArray(file, selectedFiles)?'active':''}`} onClick={() => selectFileFunction(file) } src={'/pdf-icon.png'}/>
                                </>
                              }
                              {file.file_type === 'video/mp4'&&
                                <>
                                  <div className={`${'media-file'} ${isObjectInArray(file, selectedFiles)?'active':''}`} onClick={() => selectFileFunction(file) }>
                                     <video
                                       src={file.file_url}
                                       controls
                                       autoPlay={false}
                                       className="video_thumb"
                                       playsInline
                                     />
                                  </div>
                                </>
                              }
                              <p style={{fontSize:'.8em'}}>{file.file_name}</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                  </div>
                  }
                  {filePicker &&
                    <button className='btn primary' onClick={(e) => setShowFiles(false)} disabled={selectedFiles.length===0}>Choose Files</button>
                  }
                  {filesDisplay ==='Gemini'&&
                    <div style={{marginTop:'10px', borderTop: '1px solid #999', paddingTop:'15px'}}>
                    <ImageGeneration/>
                  </div>
                  }
                  {filesDisplay ==='Video'&&
                    <div style={{marginTop:'10px', borderTop: '1px solid #999', paddingTop:'15px'}}>
                    <VideoGeneration/>
                  </div>
                  }

                </div>


                </div>
              </div>
          </div>
      </div>
      }
    </>
  )
}
