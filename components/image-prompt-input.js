"use client"
import { useState } from "react"


export function ImagePromptInput({ onSubmit, isEditing, isLoading }) {
  const [prompt, setPrompt] = useState("")

  const handleSubmit = () => {
    if (prompt.trim()) {
      onSubmit(prompt.trim())
      setPrompt("")
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <p>
          {isEditing
            ? "Describe how you want to edit the image"
            : "Describe the image you want to generate"}
        </p>
      </div>

      <textarea
        id="prompt"
        className="form-input"
        placeholder={
          isEditing
            ? "Example: Remove all text, logos, dates, headlines, and graphic overlays from this poster. Keep the background image intact and undistorted. Do not blur or replace the background — just cleanly remove the overlaid design elements so I can rebuild them in Illustrator later."
            : "Example: A 3D rendered image of a pig with wings and a top hat flying over a futuristic city..."
        }
        value={prompt}
        onChange={e => setPrompt(e.target.value)}
      />

      <button
        type="submit"
        className='btn primary'
        disabled={!prompt.trim() || isLoading}
      >

        {isEditing ? "Edit Image" : "Generate Image"}
      </button>
    </form>
  )
}
