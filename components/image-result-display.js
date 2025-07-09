"use client"


import { useState } from "react"
import { dataURLToFile } from '@/lib/utils'
import { showSuccess } from '@/lib/toast';
import { showError } from '@/lib/toast';
import { showInfo } from '@/lib/toast';
import { useFilesContext } from "@/context/files-context"
import { useUserContext } from "@/context/user-context"
import { storeFileInfo } from "@/lib/supabase";



 export function ImageResultDisplay({
  imageUrl,
  description,
  onReset,
  conversationHistory = []
}) {
  const { setFiles } = useFilesContext();
  const { user } = useUserContext();

  const [showHistory, setShowHistory] = useState(false)

  const handleDownload = () => {
    // Create a temporary link element
    const link = document.createElement("a")
    link.href = imageUrl
    link.download = `gemini-image-${Date.now()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const toggleHistory = () => {
    setShowHistory(!showHistory)
  }


  const saveFile = async () => {

    try{

      const fileName = `gemini-image-${Date.now()}.png`

      const file = dataURLToFile(imageUrl, fileName)

      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData
      })

      const result = await res.json()

      if (res.ok) {

        const fileData={
          file_url:result.url,
          file_type:'image/png',
          file_name:fileName
        }
        handleFileFunction(fileData)

      }else{
        showError(result.error)
      }

    }catch(error){
      console.log('file upload error', error)
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
      console.log('Error saving file: ', error)
    }
  }

  return (
    <div>
      <div>
        <h2>Generated Image</h2>
        <div>
          <button className="primary btn" onClick={saveFile}>
            Save
          </button>
          <button style={{marginLeft:'10px'}} className="primary btn" onClick={handleDownload}>
            Download
          </button>
          {conversationHistory.length > 0 && (
            <button  style={{marginLeft:'10px'}} className="secondary btn" onClick={toggleHistory}>
              {showHistory ? "Hide History" : "Show History"}
            </button>
          )}
          <button style={{marginLeft:'10px'}} className="secondary btn" onClick={onReset}>
            Create New Image
          </button>
        </div>
      </div>

      <div>
        <img
          src={imageUrl}
          alt="Generated"
          className="generated-image"
        />
      </div>

      {description && (
        <div>
          <h3>Description</h3>
          <p>{description}</p>
        </div>
      )}

      {showHistory && conversationHistory.length > 0 && (
        <div>
          <h3>Conversation History</h3>
          <div>
            {conversationHistory.map((item, index) => (
              <div key={index}>
                <p
                  className={`${
                    item.role === "user" ? "text-foreground" : "text-primary"
                  }`}
                >
                  {item.role === "user" ? "You" : "Gemini"}
                </p>
                <div>
                  {item.parts.map((part, partIndex) => (
                    <div key={partIndex}>
                      {part.text && <p className="text-sm">{part.text}</p>}
                      {part.image && (
                        <div>
                          <img
                            src={part.image}
                            alt={`${item.role} image`}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
