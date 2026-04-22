"use client"
import { useState } from "react"
import { ImageUpload } from "@/components/image-upload"
import { ImagePromptInput } from "@/components/image-prompt-input"
import { ImageResultDisplay } from "@/components/image-result-display"
import { showSuccess } from '@/lib/toast';
import { showError } from '@/lib/toast';
import { showInfo } from '@/lib/toast';
export default function ImageGeneration() {
  const [image, setImage] = useState(null)
  const [generatedImage, setGeneratedImage] = useState(null)
  const [description, setDescription] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [history, setHistory] = useState([])

  const handleImageSelect = imageData => {
    console.log('imageData', imageData)
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
        history: history.length > 0 ? history : undefined
      }

      const response = await fetch("/api/gemini", {
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

        // Update history locally - add user message
        const userMessage = {
          role: "user",
          parts: [
            { text: prompt },
            ...(imageToEdit ? [{ image: imageToEdit }] : [])
          ]
        }

        // Add AI response
        const aiResponse = {
          role: "model",
          parts: [
            ...(data.description ? [{ text: data.description }] : []),
            ...(data.image ? [{ image: data.image }] : [])
          ]
        }

        // Update history with both messages
        setHistory(prevHistory => [...prevHistory, userMessage, aiResponse])

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

          {!displayImage && !loading ? (
            <>
              <ImageUpload
                onImageSelect={handleImageSelect}
                currentImage={currentImage}
              />
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
                conversationHistory={history}
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
