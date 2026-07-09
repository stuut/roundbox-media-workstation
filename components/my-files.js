'use client';
import { useState, useEffect, useRef } from 'react';
import { useFilesContext } from "@/context/files-context"
import { useEditItemContext } from "@/context/edit-item-context"
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
import { ThreeDotMenu } from "components/three-dot-menu"
import { ImageComponent } from "components/my-files-page"
import {
Copy
} from 'lucide-react';

const imageTypes = ['image/png', 'image/jpeg']
const audioTypes = ['audio/mpeg', 'audio/wav', 'audio/aac', 'audio/webm', 'audio/ogg']
const videoTypes = ['video/mp4', 'video/webm']
const documentTypes = ['application/pdf']


export default function MyFiles() {
  const pathname = usePathname();
  const { user } = useUserContext();
  const { showFiles, setShowFiles, files, setFiles, selectedFiles, setSelectedFiles, filePicker, fileLimit, setFileLimit} = useFilesContext();
  const { displayEditItem, setDisplayEditItem, item, setItem } = useEditItemContext();
  const [userId, setUserId] = useState(null)
  const [filesDisplay, setFilesDisplay] = useState('My Files')
  const [uploading, setUploading] = useState(false)
  const [fileFilters, setFileFilters] = useState([])
  const [imageSearch, setImageSearch] = useState('')


  const editMedia = (media) => {
    setDisplayEditItem(true)
    setItem(media)
  }

  useEffect(() => {
    if (!displayEditItem && item) {

      console.log('displayEditItem', item)

        setItem(null)
        getData()
    }
  }, [displayEditItem, item]);



  const getFilterArray = () => {

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

    if (fileFilters.includes('documents')){
      filterArray.push(...documentTypes)
    }

    return filterArray

  }


  const getData = async () => {

    if (!user?.id) return

    try {

      const myFiles = await getFiles(user.id, getFilterArray());
      setFiles(myFiles);
    } catch (error) {
      console.log('error getting files', error);
    }
  };


  const getSearchData = async () => {

    if (!user?.id) return


    try{

      let filterArray


      if (fileFilters.length === 0){
        filterArray = [...imageTypes, ...videoTypes, ...audioTypes, ...documentTypes]
      }else{
        filterArray = getFilterArray()
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

  if (fileLimit === 0){
    if (isObjectInArray(data, selectedFiles)){
      setSelectedFiles(prev => prev.filter(remove => remove.id !== data.id));

    }else{
      setSelectedFiles(selectedFiles => [...selectedFiles, data])
    }
  }else{
    setSelectedFiles([data])
  }

}

const uploadFileLoop = async(event) => {
  if (!event.target.files || event.target.files.length === 0) {
    throw new Error('You must select an image to upload.')
  }

  setUploading(true)

  for (const file of event.target.files) {
    try{
      await uploadFile(file)
    } catch (err){
      notifyError(err)
      setUploading(false)
    }
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

const copyFileUrl = (url) => {
  navigator.clipboard.writeText(url).then(function() {
    // Success feedback (optional)
    showSuccess(`Copied file url`)

  }).catch(function(err) {
    // Error handling (optional)
    console.error('Could not copy url: ', err);
  });
}

  return (
    <>
      {showFiles&&
        <>
        {  pathname !== '/my-media' &&
          <div className='overlay' onClick={() => setShowFiles(false)}>
          </div>
        }
          <div className='center-absolute' style={{width:'100%', maxWidth:'1200px', height:'800px', zIndex:'1000'}}>
            <div className="card" onClick={(e) => e.stopPropagation()}>
              <div style={{display:'flex', padding:'15px'}}>
                <div style={{flex:1, flexDirection:'column', display:'flex'}}>
                  <button onClick={() => setFilesDisplay('My Files')} className={`${'btn'} ${filesDisplay ==='My Files'?'primary':'secondary'}`}>My files</button>
                  <button style={{marginTop:'10px'}} onClick={() => setFilesDisplay('Gemini')} className={`${'btn'} ${filesDisplay ==='Gemini'?'primary':'secondary'}`}>Gemini</button>
                  <button style={{marginTop:'10px'}} onClick={() => setFilesDisplay('Video')} className={`${'btn'} ${filesDisplay ==='Video'?'primary':'secondary'}`}>Veo</button>
                  <button style={{marginTop:'10px'}} onClick={() => setFilesDisplay('X Z Image Turbo')} className={`${'btn'} ${filesDisplay ==='X Z Image Turbo'?'primary':'secondary'}`}>X Z Image Turbo</button>
                </div>
                <div style={{flex:3, padding:'15px', overflowY: 'hidden', height: '800px'}}>
                  <div style={uploading? {display:'block'}:{display:'none'}} className={'loader_screen'}>
                      <div style={{transform:'translate(-50%, -50%)'}}  className="loader"></div>
                  </div>
                  <div>
                    {(filePicker && selectedFiles.length>0) &&
                      <button className='btn primary btn-outline' onClick={(e) => setShowFiles(false)} disabled={selectedFiles.length===0}>Choose Files</button>
                    }
                    <div style={{display:'flex', flexDirection:'row',  flexWrap: 'wrap', gap: '1%'}}>

                      {selectedFiles.map((file, index)=>{
                        return(
                          <ImageComponent
                            key={file.id}
                            fileFilters={fileFilters}
                            file={file}
                            editMedia={editMedia}
                            copyFileUrl={copyFileUrl}
                            selectedFiles={selectedFiles}
                            selectFileFunction={selectFileFunction}
                            width={'20%'}
                            objectFit={false}
                            showSelection={false}
                            />
                          )
                      })}
                    </div>


                    <div className="properties-container" style={{marginTop:'15px'}}>
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
                              marginTop:'10px',
                              marginBottom: '10px',
                              marginLeft: '5px',
                              height: '38.5px'
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
                          {selectedFiles.length===1 &&
                            <>
                              <button style={{marginLeft:'10px'}} className='btn secondary' onClick={()=>editMedia(selectedFiles[0])}>Edit Image</button>
                            </>
                          }
                      </div>
                      <div style={{display:'flex', gap:'10px', margin:'15px 0px'}}>
                        <div style={{marginLeft:'5px', display: 'flex', alignItems: 'center'}}>
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
                        <div style={{marginLeft:'5px', display: 'flex', alignItems: 'center'}}>
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
                        <div style={{marginLeft:'5px', display: 'flex', alignItems: 'center'}}>
                          <Checkbox
                            id={'documents'}
                            className="form-check-input"
                            type="checkbox"
                            onChange={() => checkboxFunction('documents')}
                            checked={fileFilters.includes('documents')}
                            sx={{
                              color: 'var(--md-sys-color-secondary)',
                              '&.Mui-checked': {
                                color: 'var(--md-sys-color-primary)',
                              },
                            }}
                          />
                          <span style={{marginLeft:'5px'}}>documents</span>
                        </div>
                        <div style={{marginLeft:'5px', display: 'flex', alignItems: 'center'}}>
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
                    <div style={{
                      overflowY: 'scroll',
                      height: 'calc(100% - 200px)'
                    }}>

                      <div style={{
                        display:'flex',
                        flexDirection:'row',
                        flexWrap: 'wrap',
                        gap:'10px 10px',
                        justifyContent: 'center',
                        margin: '0 auto'
                      }}>
                        {files.map((file, index)=>{
                          return (
                            <ImageComponent
                              key={file.id}
                              fileFilters={fileFilters}
                              file={file}
                              editMedia={editMedia}
                              copyFileUrl={copyFileUrl}
                              selectedFiles={selectedFiles}
                              selectFileFunction={selectFileFunction}
                              width={'25%'}
                              objectFit={true}
                              showSelection={true}
                              />
                          )
                        })}
                      </div>
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
