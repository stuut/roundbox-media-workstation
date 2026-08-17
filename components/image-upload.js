"use client"
import { useCallback, useState, useEffect, useRef } from "react"
import { useDropzone } from "react-dropzone"
import { useFilesContext } from "@/context/files-context"
import { isObjectInArray } from '@/lib/utils'
import { urlToFile } from '@/lib/utils'
import { getFiles } from "@/lib/supabase";
import {
X,
} from 'lucide-react';
import { getFilesSearch } from "@/lib/supabase";


const imageTypes = ['image/png', 'image/jpeg']
const audioTypes = ['audio/mpeg', 'audio/wav', 'audio/aac', 'audio/webm', 'audio/ogg']
const videoTypes = ['video/mp4', 'video/webm']


export function formatFileSize(bytes) {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

export function ImageUpload({ onImageSelect, currentImage, user, filename }) {
  const [showMyFiles, setShowMyFiles] = useState(false)
  const {files, setFiles, selectedFiles, setSelectedFiles} = useFilesContext();
  const currentPage = useRef(1)
  const [loader, setLoader] = useState(false)
  const [imageSearch, setImageSearch] = useState('')

  const updatePage = () => {
    currentPage.current = currentPage.current+1
    getMoreData()
  }

  const getMoreData = async () => {

    if (!user?.id) return

     setLoader(true)

    try {
      const myFiles = await getFiles(user.id, imageTypes, currentPage.current);
      setFiles(prev => [...prev, ...myFiles]);
    } catch (error) {
      console.log('error getting files', error);
    }finally{
      setLoader(false)
    }
  };

    const getSearchData = async () => {

        if (!user?.id) return

     setLoader(true)
  
      try{
        const myFiles = await getFilesSearch(user.id, imageSearch, imageTypes);
        if (Array.isArray(myFiles)) {
          setFiles(myFiles);
        }
  
      } catch (error) {
        console.log('error getting files', error);
      }finally{
        setLoader(false)
      }
    
    }



  
  const getData = async (userId, fileTypes) => {
     setLoader(true)

    try {
      const myFiles = await getFiles(user.id, fileTypes, 0);
      setFiles(myFiles);
    } catch (error) {
      console.log('error getting files', error);
    }finally{
      setLoader(false)
    }
  };

  useEffect(()=>{
      if (showMyFiles){
        getData(user.id, imageTypes)
      }
  },[showMyFiles])


  const handleSearchChange = (data) => {
    setImageSearch(data)
    if (data.length === 0){
      getData(user.id, imageTypes)
    }
  }


  const selectFileFunction = (data) => {
    /*
    urlToFile(data.file_url, data.file_name, data.file_type)
    .then(fileObject => {
      if (fileObject) {
        setSelectedFile(fileObject)
        // You can now use this fileObject, for example, to upload it or display it.
      }
    });*/
    handleImageUrl(data)
  }

  async function handleImageUrl(image) {
    try {


      const proxiedUrl = `/api/image-proxy?url=${image.file_url}`


      const response = await fetch(proxiedUrl)


      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const blob = await response.blob()

      const fileSizeBytes = blob.size; 
      console.log(`File size: ${fileSizeBytes} bytes`);

      const reader = new FileReader()

      reader.onload = event => {
        if (event.target && event.target.result) {
          const result = event.target.result
          onImageSelect(result)
          setShowMyFiles(false)
        }
      }

      reader.onerror = error => {
        console.error("Error reading file:", error)
      }

      reader.readAsDataURL(blob)
    } catch (error) {
      console.error("Error fetching image:", error)
    }
}


  const onDrop = useCallback(

    acceptedFiles => {

      const file = acceptedFiles[0]

      if (!file) return


      const reader = new FileReader()
      reader.onload = event => {
        if (event.target && event.target.result) {
          const result = event.target.result
          onImageSelect(result)
        }
      }
      reader.onerror = error => {
        console.error("Error reading file:", error)
      }
      reader.readAsDataURL(file)
    },

    [onImageSelect]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
    'image/png': ['.png'],
    'image/jpeg': ['.jpg'],
  },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false
  })

  const handleRemove = () => {
   
    onImageSelect(null)
  }

  return (
    <>
    {showMyFiles?(
      <div>
        <div style={{display:'flex', gap:'10px', margin:'15px 0px', alignItems: 'center',}}>
          <div
            onClick={()=>setShowMyFiles(false)}
            style={{
              backgroundColor: 'var(--md-sys-color-error)',
              color: '#ffffff',
              borderRadius: '50%',               
              minWidth: '30px',
              minHeight: '30px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
            <X/>
          </div>
          <input
            id="image-filter"
            type='text'
            value={imageSearch}
            onChange={(e) => handleSearchChange(e.target.value)}
            className={'form-input'}
            placeholder='Filter'
            style={{
              maxWidth:'400px'
            }}
          />
          <button className='btn primary btn-sm' onClick={getSearchData} disabled={imageSearch.length===0}>Search</button>
        </div>
        <div style={{height: '300px', 
          overflowY: 'scroll', }}>


          <div style={{
            display:'flex', 
            flexDirection:'row',  
            flexWrap: 'wrap',  
            position:'relative',
            gap:'10px 10px',
            justifyContent: 'center',
            margin: '0 auto'
            }}>
            <div style={loader? {display:'block', height: 'calc(100% + 70px)'}:{display:'none'}} className={'loader_screen'}>
              <div style={{transform:'translate(-50%, -50%)'}}  className="loader"></div>
            </div>  
            {files.map((file, index)=>{
              return (
                <div key={file.id} style={{width:'18%', margin:'1%'}}>
                    <div>
                      {(file.file_type === 'image/png' || file.file_type === 'image/jpeg')&&
                        <img className={`${'media-image'} ${isObjectInArray(file, selectedFiles)?'active':''}`} onClick={() => selectFileFunction(file) } src={file.file_url}/>
                      }
                  </div>
                </div>
              )
            })}

          </div>
          {files.length>=50&&
              <button style={{margin:'15px auto', display:'block'}} className='btn primary' onClick={updatePage}>Load More</button>
            }
        </div>
      </div>
    ):(
      <div>
        {!currentImage ? (
          <div>
          <div style={{display:'flex', alignItems:'center'}}>
              <div style={{marginRight:'10px'}}
                {...getRootProps()}
                className={`
                ${isDragActive ? "bg-secondary/50" : "bg-secondary"}
              `}
              >
              <input {...getInputProps()} />
              <div>
                  <button className="btn secondary btn-sm">Upload File</button>
              </div>
            </div>
            <button onClick={()=>setShowMyFiles(true)} className="btn secondary btn-sm">Choose Existing File</button>

          </div>
        <p style={{fontSize:'.8em'}}>
          Maximum file size: 10MB
        </p>
      </div>
        ) : (
          <div>
            <div>
              <div>
                {/* 
                <p>
                 
                  {selectedFile?.name || filename || ""}
                </p>
                {selectedFile && (
                  <p>
                    {formatFileSize(selectedFile?.size ?? 0)}
                  </p>
                )}*/}
              </div>
            </div>
            <div style={{marginBottom:'15px', position:'relative', display: 'inline-block'}}>
              <div
                onClick={handleRemove}
                style={{
                  position: 'absolute',
                  top: '5px',
                  right: '5px',
                  backgroundColor: 'var(--md-sys-color-error)',
                  color: '#ffffff',
                  borderRadius: '50%',               
                  width: '30px',
                  height: '30px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                <X/>
              </div>
              <img
                className='media-image-selected'
                style={{maxWidth:'150px'}}
                src={currentImage}
                alt="Selected"
              />
            </div>
          </div>
        )}
      </div>

    )}


    </>

  )
}
