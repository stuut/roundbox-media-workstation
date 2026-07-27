"use client"
import { useState } from "react"
import {
Square,
RectangleVertical,
RectangleHorizontal,
} from 'lucide-react';

export function ImagePromptInput({ onSubmit, isEditing, isLoading }) {
  const [prompt, setPrompt] = useState("")
  const [aspectRatio, setAspectRatio] = useState('1:1')

  const handleSubmit = () => {
    if (prompt.trim()) {
      onSubmit(prompt.trim(), aspectRatio)
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
      <div className="properties-container" style={{display:'inline-block'}}>
        <p className="label" style={{marginTop:'0px'}}><strong>Aspect Ratio</strong></p>
        <div style={{display:'flex', alignItems:'center'}}>
          <Square onClick={()=> setAspectRatio('1:1')} size={35} className={`cropped-image ${aspectRatio==='1:1'?'active':''}`} alt="crop ratio 1/1" />
          <RectangleVertical onClick={()=> setAspectRatio('9:16')} size={35}  className={`cropped-image ${aspectRatio==='9:16'?'active':''}`} alt="crop ratio 9/16" />
          <RectangleHorizontal onClick={()=> setAspectRatio('16:9')} size={35}  className={`cropped-image ${aspectRatio==='16:9'?'active':''}`}  alt="crop ratio 16/9" />
        </div> 
      </div>
      <div>
          <button
            type="submit"
            className='btn primary'
            disabled={!prompt.trim() || isLoading}
          >
    
        {isEditing ? "Edit Image" : "Generate Image"}
      </button>
      </div>
    </form>
  )
}
