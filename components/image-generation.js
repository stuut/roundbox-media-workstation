"use client"
import { useState } from "react"
import { ImageUpload } from "@/components/image-upload"
import { ImagePromptInput } from "@/components/image-prompt-input"
import { ImageResultDisplay } from "@/components/image-result-display"
import { showSuccess } from '@/lib/toast';
import { showError } from '@/lib/toast';
import { showInfo } from '@/lib/toast';
import { useUserContext } from "@/context/user-context"

export default function ImageGeneration() {
  const [image, setImage] = useState(null)
  const [generatedImage, setGeneratedImage] = useState(null)
  const [description, setDescription] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [history, setHistory] = useState(null)
  const { user } = useUserContext();

  const handleImageSelect = imageData => {
    console.log('imageData', imageData)
    setImage(imageData || null)
  }

  const handlePromptSubmit = async (prompt, aspectRatio) => {
    try {
      setLoading(true)

      // Prepare the request data as JSON
      const requestData = {
        prompt,
        image: image?image:null,
        aspectRatio:aspectRatio,
        previous_interaction_id:history?history:null
      }

      const response = await fetch("/api/gemini/nano-banana/text-and-image-to-image", {
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

        // Update the generated image and description
        setGeneratedImage(data.image)
        setDescription(data.description || null)
        setHistory(data.interactionId)


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
  }

  // If we have a generated image, we want to edit it next time
  const currentImage = generatedImage || image
  const isEditing = !!currentImage

  // Get the latest image to display (always the generated image)
  const displayImage = generatedImage

  return (
    <main>
      <div>

          {!displayImage && !loading ? (
            <>
            <div className='properties-container' style={{marginBottom:'15px'}}>
              <p style={{marginTop:'0px', marginBottom:'0px'}} className='label'><strong>Reference Image</strong></p>
              <ImageUpload
                onImageSelect={handleImageSelect}
                currentImage={currentImage}
                user={user}
              />
              </div>
              <ImagePromptInput
                onSubmit={handlePromptSubmit}
                isEditing={isEditing}
                isLoading={loading}
              />
            </>
          ) : loading ? (
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
              <ImageResultDisplay
                imageUrl={displayImage || ""}
                description={description}
                onReset={handleReset}
                fileType={'image/jpeg'}
              />
              <ImagePromptInput
                onSubmit={handlePromptSubmit}
                isEditing={true}
                isLoading={loading}
              />
            </>
          )}
      </div>
    </main>
  )
}
