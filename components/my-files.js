'use client';
import { useState, useEffect, useRef } from 'react';
import { useFilesContext } from "@/context/files-context"
import { useUserContext } from "@/context/user-context"
import { isObjectInArray } from '@/lib/utils'
import { getFiles } from "@/lib/supabase";
import ImageGeneration from "components/image-generation"
import VideoGeneration from "components/video-generation"
import DisplayVideo from "components/display-video"
import {Upload, Pause, Play} from 'lucide-react';
import Checkbox from '@mui/material/Checkbox';
import { storeFileInfo } from "@/lib/supabase";
import { deleteFiles } from "@/lib/supabase";
import { getFilesSearch } from "@/lib/supabase";
import { showSuccess } from '@/lib/toast';
import { showError } from '@/lib/toast';
import { showInfo } from '@/lib/toast';
import JSZip from "jszip";
import ReactPlayer from 'react-player'
import { usePathname } from 'next/navigation';


const imageTypes = ['image/png', 'image/jpeg']
const audioTypes = ['audio/mpeg', 'audio/wav', 'audio/aac', 'audio/webm', 'audio/ogg']
const videoTypes = ['video/mp4', 'video/webm']

export default function MyFiles() {
  const pathname = usePathname();
  const { user } = useUserContext();
  const { showFiles, setShowFiles, files, setFiles, selectedFiles, setSelectedFiles, filePicker} = useFilesContext();
  const [userId, setUserId] = useState(null)
  const [filesDisplay, setFilesDisplay] = useState('My Files')
  const [uploading, setUploading] = useState(false)
  const [fileFilters, setFileFilters] = useState([])
  const [imageSearch, setImageSearch] = useState('')


  const getData = async () => {

    try {

      const filterArray = []

      if (fileFilters.includes('images')){
        filterArray.push(...imageTypes)
      }

      if (fileFilters.includes('videos')){
        filterArray.push(...videoTypes)
      }

      if (fileFilters.includes('audio')){
        filterArray.push(...audioTypes)
      }

      const myFiles = await getFiles(user.id, filterArray);
      setFiles(myFiles);
    } catch (error) {
      console.log('error getting files', error);
    }
  };


  const getSearchData = async () => {
    try{
      let filterArray = []

      if (fileFilters.includes('images')){
        filterArray.push(...imageTypes)
      }

      if (fileFilters.includes('videos')){
        filterArray.push(...videoTypes)
      }

      if (fileFilters.includes('audio')){
        filterArray.push(...audioTypes)
      }



      if (fileFilters.length === 0){
        filterArray = [...imageTypes, ...videoTypes, ...audioTypes]
      }

      const myFiles = await getFilesSearch(user.id, imageSearch, filterArray);

      if (Array.isArray(myFiles)) {
        setFiles(myFiles);
      }



    } catch (error) {
      console.log('error getting files', error);
    }

  }


  const handleSearchChange = (data) => {
    setImageSearch(data)
    if (data.length === 0){
      getData()
    }
  }




useEffect(()=>{

      if (imageSearch.length === 0){
        getData()
      }else{
        getSearchData();
      }


},[fileFilters] )


const selectFileFunction = (data) => {

  if (isObjectInArray(data, selectedFiles)){
    setSelectedFiles(prev => prev.filter(remove => remove.id !== data.id));

  }else{
    setSelectedFiles(selectedFiles => [...selectedFiles, data])
  }

}

const uploadFileLoop = async(event) => {
  if (!event.target.files || event.target.files.length === 0) {
    throw new Error('You must select an image to upload.')
  }
  console.log('event.target.files', event.target.files)

  setUploading(true)

  for (const file of event.target.files) {
      await uploadFile(file)
  // color = 'yellow'; // ❌ Throws TypeError: Assignment to constant variable.
  }

  setUploading(false)
}



const uploadFile = async (file) => {
  try {
    //const file = event.target.files[0];
    const fileExt = file.name.split('.').pop();
    const filePath = `${user.id}/${Math.random()}.${fileExt}`;
    const fileType = file.type;
    const fileName = file.name
    const formData = new FormData()
    formData.append('file', file)

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


  } catch (error) {
    console.log(error)
    alert('Error uploading image!')
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

  setFiles(prev => [newFile, ...prev]);


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


const checkboxFunction = (item) => {

    setFileFilters((prev) =>
     prev.includes(item)
       ? prev.filter((i) => i !== item) // Remove if exists
       : [...prev, item]                // Add if missing
   );

}

async function downloadAndZip() {
  const zip = new JSZip();

  // 1. Fetch all files and add them to the zip
  const downloadPromises = selectedFiles.map(async (file, index) => {
    const response = await fetch(file.file_url);
    const blob = await response.blob();

    // Extract filename from URL or use a default
    const filename = file.file_url.split('/').pop() || `file-${index}`;
    zip.file(filename, blob);
  });

  await Promise.all(downloadPromises);

  // 2. Generate the ZIP blob
  const zipBlob = await zip.generateAsync({ type: "blob" });

  // 3. Trigger the browser download
  const link = document.createElement('a');
  link.href = URL.createObjectURL(zipBlob);
  link.download = "files.zip";
  link.click();

  // Cleanup
  URL.revokeObjectURL(link.href);
}



  return (
    <>
      {showFiles&&
        <>
        {  pathname !== '/my-media' &&
          <div className='overlay' onClick={() => setShowFiles(false)}>
          </div>
        }
          <div className='center-absolute' style={{width:'100%', maxWidth:'900px'}}>
            <div className="card" onClick={(e) => e.stopPropagation()}>
              <div style={{display:'flex', padding:'15px'}}>
                <div style={{flex:1, flexDirection:'column', display:'flex'}}>
                  <button onClick={() => setFilesDisplay('My Files')} className={`${'btn'} ${filesDisplay ==='My Files'?'primary':'secondary'}`}>My files</button>
                  <button style={{marginTop:'10px'}} onClick={() => setFilesDisplay('Gemini')} className={`${'btn'} ${filesDisplay ==='Gemini'?'primary':'secondary'}`}>Gemini</button>
                  <button style={{marginTop:'10px'}} onClick={() => setFilesDisplay('Video')} className={`${'btn'} ${filesDisplay ==='Video'?'primary':'secondary'}`}>Veo</button>
                  <button style={{marginTop:'10px'}} onClick={() => setFilesDisplay('X Z Image Turbo')} className={`${'btn'} ${filesDisplay ==='X Z Image Turbo'?'primary':'secondary'}`}>X Z Image Turbo</button>

                </div>
                <div style={{flex:3, padding:'15px', overflowY: 'scroll', maxHeight: '800px'}}>
                  <div>
                    <div style={{display:'flex', flexDirection:'row',  flexWrap: 'wrap', gap: '10px'}}>
                      {selectedFiles.map((file, index)=>{
                        return(
                              <div key={file.id} style={{width:'25%'}}>
                                {(file.file_type === 'image/png' || file.file_type === 'image/jpeg')&&
                                  <img style={{width:'100%', height:'auto', objectFit:'cover', borderRadius:'5px'}} className={`${'media-image'}`} src={file.file_url}/>
                                }
                                {file.file_type === 'application/pdf'&&
                                  <>
                                    <img className={`${'media-file'}`} src={'/pdf-icon.png'}/>
                                  </>
                                }
                                {file.file_type === 'video/mp4'&&
                                  <>
                                    <div>
                                       <ReactPlayer
                                         src={file.file_url}
                                         controls
                                         autoPlay={false}
                                         className="video_thumb"
                                         playsInline
                                         style={{
                                           minWidth:'unset',
                                           borderRadius: '5px'
                                         }}
                                       />
                                    </div>
                                  </>
                                }
                              </div>
                          )
                      })}
                    </div>
                    <div style={{display:'flex', alignItems:'center'}}>
                      <input
                        style={{display:'none'}}
                        type="file"
                        id="file-upload"
                        accept="image/*,.pdf,.doc"
                        onChange={uploadFileLoop}
                        disabled={uploading}
                        multiple
                      />
                      <label
                        className="btn secondary icon-button"
                        htmlFor="file-upload"
                        style={{
                          padding: '10px 15px',
                          marginTop:'0px',
                          marginBottom: '0px',
                          marginLeft: '5px'
                        }}
                      >
                        <Upload className='button-icon'/>
                        {`Upload Files`}
                      </label>
                      {selectedFiles.length>0 &&
                        <>
                          <button style={{marginLeft:'10px'}} className='btn danger' onClick={deleteSelectedFiles}>Delete Files</button>
                          <button style={{marginLeft:'10px'}} className='btn primary' onClick={downloadAndZip}>Download Files</button>
                          <button style={{marginLeft:'10px'}} className='btn secondary' onClick={()=>setSelectedFiles([])}>Clear Selection</button>
                        </>
                      }
                        </div>
                        {filePicker &&
                          <button className='btn primary' onClick={(e) => setShowFiles(false)} disabled={selectedFiles.length===0}>Choose Files</button>
                        }
                    <div style={{display:'flex', gap:'10px', margin:'15px 0px'}}>
                      <div style={{marginLeft:'5px'}}>
                        <Checkbox
                          id={'iimages'}
                          className="form-check-input"
                          type="checkbox"
                          onChange={() => checkboxFunction('images')}
                          checked={fileFilters.includes('images')}
                          sx={{
                            color: 'var(--md-sys-color-secondary)',
                            '&.Mui-checked': {
                              color: 'var(--md-sys-color-primary)',
                            },
                          }}
                        />
                        <span style={{marginLeft:'5px'}}>Images</span>
                      </div>
                      <div style={{marginLeft:'5px'}}>
                        <Checkbox
                          id={'iimages'}
                          className="form-check-input"
                          type="checkbox"
                          onChange={() => checkboxFunction('videos')}
                          checked={fileFilters.includes('videos')}
                          sx={{
                            color: 'var(--md-sys-color-secondary)',
                            '&.Mui-checked': {
                              color: 'var(--md-sys-color-primary)',
                            },
                          }}
                        />
                        <span style={{marginLeft:'5px'}}>videos</span>
                      </div>
                      <div style={{marginLeft:'5px'}}>
                        <Checkbox
                          id={'iimages'}
                          className="form-check-input"
                          type="checkbox"
                          onChange={() => checkboxFunction('audio')}
                          checked={fileFilters.includes('audio')}
                          sx={{
                            color: 'var(--md-sys-color-secondary)',
                            '&.Mui-checked': {
                              color: 'var(--md-sys-color-primary)',
                            },
                          }}
                        />
                        <span style={{marginLeft:'5px'}}>audio</span>
                      </div>

                    </div>
                    <div style={{display:'flex', gap:'10px', margin:'15px 0px'}}>
                      <input
                        id="image-filter"
                        type='text'
                        value={imageSearch}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        className={'form-input'}
                        placeholder='Filter'
                      />
                      <button className='btn primary' onClick={getSearchData} disabled={imageSearch.length===0}>Search</button>
                    </div>
                      </div>
                  {(filesDisplay ==='My Files') &&

                    <div style={{display:'flex', flexDirection:'row',  flexWrap: 'wrap'}}>
                      {files.map((file, index)=>{
                        const isVideo = file.file_type === "video/mp4" || file.file_type === 'video/webm' || file.file_url.match(/\.(mp4|mov|m4v)$/i);
                        return (
                          <div key={file.id} style={{width:'18%', margin:'1%'}}>

                              {(file.file_type === 'image/png' || file.file_type === 'image/jpeg')&&
                                <img className={`${'media-image'} ${isObjectInArray(file, selectedFiles)?'active':''}`} onClick={() => selectFileFunction(file) } src={file.file_url}/>
                              }
                              {file.file_type === 'application/pdf'&&
                                <>
                                  <img className={`${'media-file'} ${isObjectInArray(file, selectedFiles)?'active':''}`} onClick={() => selectFileFunction(file) } src={'/pdf-icon.png'}/>
                                </>
                              }
                              {(file.file_type === 'video/mp4' || file.file_type === 'video/webm' || isVideo)&&
                                <>
                                  <div className={`${'media-file video'} ${isObjectInArray(file, selectedFiles)?'active':''}`} onClick={() => selectFileFunction(file) }>
                                     <video
                                       src={file.file_url}
                                       controls
                                       autoPlay={false}
                                       className="video_thumb"
                                       playsInline
                                       style={{minWidth:'unset'}}
                                     />
                                  </div>
                                </>
                              }
                              {(file.file_type === 'audio/mpeg' || file.file_type === 'audio/wav' || file.file_type === 'audio/aac' || file.file_type === 'audio/webm' || file.file_type === 'audio/ogg')&&
                                <div className={`${'media-file'} ${isObjectInArray(file, selectedFiles)?'active':''}`} onClick={() => selectFileFunction(file) }>
                                  <Audio file={file}/>
                                </div>
                              }
                              {/*}<p style={{fontSize:'.8em'}}>{file.file_name}</p>*/}

                          </div>
                        )
                      })}
                    </div>


                  }

                  {filesDisplay ==='Gemini'&&
                    <div style={{marginTop:'10px', paddingTop:'15px'}}>
                    <ImageGeneration/>
                  </div>
                  }
                  {filesDisplay ==='Video'&&
                    <div style={{marginTop:'10px', paddingTop:'15px'}}>
                    <VideoGeneration/>
                  </div>
                  }
                  {filesDisplay ==='X Z Image Turbo'&&
                    <div style={{marginTop:'10px', paddingTop:'15px'}}>
                    </div>
                  }
                </div>


                </div>
              </div>
          </div>
        </>
      }
    </>
  )
}

const Audio = ({
  file
}) => {

  const audioRef = useRef(null)
  const [isPlaying, setIsPLaying] = useState(false)

  const handleClick = () => {
    if (audioRef.current.paused) {
      audioRef.current.play();
      setIsPLaying(true)
    } else {
      audioRef.current.pause();
      setIsPLaying(false)
    }
  }



  return(
    <div className="audio-player">
      <button
        className="play-button btn primary video-button"
        onClick={handleClick}
      >
        {isPlaying ? (
          <Pause/>
        ) : (
          <Play/>
        )}
      </button>
      <div className="audio-label">{file.file_name}</div>
      <audio ref={audioRef} src={file.file_url} type="audio/mpeg"></audio>
    </div>
  )
}
