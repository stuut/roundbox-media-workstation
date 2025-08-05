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
  const [generatedImage, setGeneratedImage] = useState(null)
  const [generatedVideos, setGeneratedVideos] = useState([])

  const [description, setDescription] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [history, setHistory] = useState([])

  const handleImageSelect = imageData => {
    setImage(imageData || null)
  }

  const handlePromptSubmit = async prompt => {
    try {
      setLoading(true)

      // If we have a generated image, use that for editing, otherwise use the uploaded image
      const imageToEdit = generatedImage || image

      // Prepare the request data as JSON
      const requestData = {
        prompt,
        image: imageToEdit,
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
            file_name:video.file_name
          })

          const newVideo={
            created_at: videoinfo.created_at,
            file_url: video.file_url,
            file_type:video.file_type,
            file_name:video.file_name,
            id: videoinfo.id,
            user_id: user.id
          }

          videoUrls.push(newVideo)

        }
          setGeneratedVideos(prev => [...prev, videoUrls]);

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
    setGeneratedImage(null)
    setDescription(null)
    setLoading(false)
    setHistory([])
  }

  // If we have a generated image, we want to edit it next time
  const currentImage = generatedImage || image
  const isEditing = !!currentImage

  // Get the latest image to display (always the generated image)
  const displayImage = generatedImage

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
            <ImageUpload
              onImageSelect={handleImageSelect}
              currentImage={currentImage}
            />
            <GenerateVideoPromptInput
              onSubmit={handlePromptSubmit}
              isLoading={loading}
            />
            <div>

            </div>
          </>
        )}
      </div>

    </main>
  )
}
