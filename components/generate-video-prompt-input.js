"use client"
import { useState } from "react"


export function GenerateVideoPromptInput({ onSubmit, isEditing, isLoading }) {
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
        Describe the video you want to generate
        </p>
      </div>

      <textarea
        id="prompt"
        className="form-input"
        placeholder={"Example: A 3D rendered image of a pig with wings and a top hat flying over a futuristic city..."}
        value={prompt}
        onChange={e => setPrompt(e.target.value)}
      />

      <button
        type="submit"
        className='btn primary'
        disabled={!prompt.trim() || isLoading}
      >

        Generate Video
      </button>
    </form>
  )
}
