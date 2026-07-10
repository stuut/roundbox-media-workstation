"use client"
import { useState } from "react"
import { ImageUpload } from "@/components/image-upload"
import { GenerateVideoPromptInput } from "@/components/generate-video-prompt-input"
import { ImageResultDisplay } from "@/components/image-result-display"
import { showSuccess } from '@/lib/toast';
import { showError } from '@/lib/toast';
import { showInfo } from '@/lib/toast';
import { storeFileInfo } from "@/lib/supabase";
import { useUserContext } from "@/context/user-context"

export default function VideoGeneration() {
  const { user } = useUserContext();

  const [image, setImage] = useState(null)
  const [generatedVideos, setGeneratedVideos] = useState([])
  const [numberOfVideos, setNumberOfVideos] = useState(1)
  const [aspectRatio, setAspectRatio] = useState('16:9')
  const [durationSeconds, setDurationSeconds] = useState(8)
  const [resolution, setResolution] = useState('1080p')

  const [description, setDescription] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [history, setHistory] = useState([])

  const handleImageSelect = imageData => {
    setImage(imageData || null)
  }

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]); // strip the "data:image/png;base64," prefix
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}


const handleReferenceSubmit = async () => {
    const imageBytes = await fileToBase64(file); // convert here

    const [dressFile, glassesFile, womanFile] = [
      document.getElementById("dress-input").files[0],
      document.getElementById("glasses-input").files[0],
      document.getElementById("woman-input").files[0],
    ];

    const [dressBytes, glassesBytes, womanBytes] = await Promise.all([
      fileToBase64(dressFile),
      fileToBase64(glassesFile),
      fileToBase64(womanFile),
    ]);

    const referenceImages = [
      { image: { imageBytes: dressBytes,   mimeType: dressFile.type   }, referenceType: "asset" },
      { image: { imageBytes: glassesBytes, mimeType: glassesFile.type }, referenceType: "asset" },
      { image: { imageBytes: womanBytes,   mimeType: womanFile.type   }, referenceType: "asset" },
    ];

    await fetch("/api/generate-video", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt,
        references: [
          { imageBytes: dressBytes,   mimeType: dressFile.type },
          { imageBytes: glassesBytes, mimeType: glassesFile.type },
          { imageBytes: womanBytes,   mimeType: womanFile.type },
        ]
      })
    });
}




  const handlePromptSubmit = async prompt => {
    try {
      setLoading(true)

      // If we have a generated image, use that for editing, otherwise use the uploaded image
      // Prepare the request data as JSON
      const requestData = {
        prompt,
        image: image,
        numberOfVideos: numberOfVideos,
        aspectRatio: aspectRatio,
        durationSeconds: durationSeconds,
        resolution:resolution
        //history: history.length > 0 ? history : undefined
      }

      const response = await fetch("/api/veo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to generate image")
      }

      const data = await response.json()

      const videoUrls = []


      if (data.videos){
        for (const video of data.videos) {
          const videoinfo = await storeFileInfo({
            user_id:user.id,
            file_url: video.file_url,
            file_type:video.file_type,
            file_name:video.file_name,
            file_description:prompt??null
          })

          const newVideo={
            created_at: videoinfo.created_at,
            file_url: video.file_url,
            file_type:video.file_type,
            file_name:video.file_name,
            file_description: videoinfo.file_description,
            id: videoinfo.id,
            user_id: user.id
          }

          videoUrls.push(newVideo)

        }
          setGeneratedVideos(prev => [...prev, ...videoUrls]);

      }else {
        showError("No image returned from API")
      }
    } catch (error) {
      showError(error instanceof Error ? error.message : "An error occurred")
      console.error("Error processing request:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setImage(null)
    setGeneratedVideos(null)
    setDescription(null)
    setLoading(false)
    setHistory([])
  }

  // If we have a generated image, we want to edit it next time
  const isEditing = !!image

  return (
    <main>
      <div>
        {loading ? (
          <div
            role="status"
          >
            <div/>
            <span>
              Processing...
            </span>
          </div>
        ) : (
          <>
            <div className='properties-container' style={{marginBottom:'15px'}}>
              <p className='label'><strong>Reference Image</strong></p>
              <ImageUpload
                onImageSelect={handleImageSelect}
                currentImage={image}
                user={user}
              />
            </div>
            <div className="properties-container" style={{display:'flex', gap:'5px'}}>
              <div style={{flex:.7}}>
                <p className='label'><strong>Number Of Videos</strong></p>
                <input
                  id="number-of-videos"
                  value={numberOfVideos}
                  onChange={(e) => setNumberOfVideos(e.target.value)}
                  className={'form-input'}
                />
              </div>
              <div style={{flex:.7}}>
                <p className='label'><strong>Duration</strong></p>
                <input
                  id="number-of-videos"
                  value={durationSeconds}
                  min={1}
                  max={8}
                  onChange={(e) => setDurationSeconds(e.target.value)}
                  className={'form-input'}
                />
              </div>
              <div style={{flex:1}}>
                <p className='label'><strong>Aspect</strong></p>
                <select id="channel-select" className="form-input select" onChange={(e) => setAspectRatio(e.target.value)} value={aspectRatio}>
                    <option value={'16:9'}>Landscape</option>
                    <option value={'9:16'}>Portrait</option>

                </select>
              </div>
              <div style={{flex:1}}>
                <p className='label'><strong>Resolution</strong></p>
                <select id="channel-select" className="form-input select" onChange={(e) => setResolution(e.target.value)} value={resolution}>
                    <option value={'720p'}>720p</option>
                    <option value={'1080p'}>1080p</option>
                    <option value={'4k'}>4k</option>

                </select>
              </div>
            </div>
            <GenerateVideoPromptInput
              onSubmit={handlePromptSubmit}
              isLoading={loading}
            />

            <div>
              {generatedVideos.map((video, index)=>{
                return(
                  <div key={index}>
                    <video
                      src={video.file_url}
                      controls
                      autoPlay={false}
                      className="video_thumb"
                      playsInline
                      style={{minWidth:'unset'}}
                    />
                  </div>
                )
              })

            }

            </div>
          </>
        )}
      </div>

    </main>
  )
}
