"use client"
import { useCallback, useState, useEffect } from "react"
import { useDropzone } from "react-dropzone"
import { useFilesContext } from "@/context/files-context"
import { isObjectInArray } from '@/lib/utils'
import { urlToFile } from '@/lib/utils'
import { getFiles } from "@/lib/supabase";

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

export function ImageUpload({ onImageSelect, currentImage, user }) {
  const [selectedFile, setSelectedFile] = useState(null)
  const [showMyFiles, setShowMyFiles] = useState(false)
  const {files, setFiles, selectedFiles, setSelectedFiles} = useFilesContext();

  const getData = async (userId, fileTypes) => {
    try {
      const myFiles = await getFiles(userId, fileTypes);
      setFiles(myFiles);
    } catch (error) {
      console.log('error getting files', error);
    }
  };

  useEffect(()=>{

      if (showMyFiles){

        getData(user.id, imageTypes)

      }

  },[showMyFiles])


  const selectFileFunction = (data) => {


    urlToFile(data.file_url, data.file_name, data.file_type)
    .then(fileObject => {
      if (fileObject) {
        setSelectedFile(fileObject)
        // You can now use this fileObject, for example, to upload it or display it.
      }
    });

    handleImageUrl(data.file_url, onImageSelect)

  }


  async function handleImageUrl(url, onImageSelect) {
    try {
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const blob = await response.blob()
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


  // Update the selected file when the current image changes
  useEffect(() => {
    if (!currentImage) {
      setSelectedFile(null)
    }
  }, [currentImage])

  const onDrop = useCallback(

    acceptedFiles => {

      const file = acceptedFiles[0]

      if (!file) return

      setSelectedFile(file)

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
    setSelectedFile(null)
    onImageSelect("")
  }

  return (
    <>
    {showMyFiles?(
      <div>
        <button onClick={() => setShowMyFiles(false)} className='btn danger'>Cancel</button>
        <div style={{display:'flex', flexDirection:'row',  flexWrap: 'wrap'}}>
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
                  <button className="btn primary">Upload File</button>
              </div>
            </div>
            <button onClick={()=>setShowMyFiles(true)} className="btn primary">Choose Existing File</button>

          </div>
        <p style={{fontSize:'.8em'}}>
          Maximum file size: 10MB
        </p>
      </div>
        ) : (
          <div>
            <div>
              <div>
                <p>
                  {selectedFile?.name || "Current Image"}
                </p>
                {selectedFile && (
                  <p>
                    {formatFileSize(selectedFile?.size ?? 0)}
                  </p>
                )}
              </div>
              <button
                className='btn danger'
                variant="ghost"
                size="icon"
                onClick={handleRemove}
              >
                <span>Remove image</span>
              </button>
            </div>
            <div style={{marginBottom:'15px'}}>
              <img
                className='media-image-selected'
                style={{maxWidth:'250px'}}
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
