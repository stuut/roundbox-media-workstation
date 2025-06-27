"use client"

import { useState } from "react"

export function ImageResultDisplay({
  imageUrl,
  description,
  onReset,
  conversationHistory = []
}) {
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

  return (
    <div>
      <div>
        <h2>Generated Image</h2>
        <div>
          <button onClick={handleDownload}>
            Download
          </button>
          {conversationHistory.length > 0 && (
            <button  onClick={toggleHistory}>
              {showHistory ? "Hide History" : "Show History"}
            </button>
          )}
          <button onClick={onReset}>
            Create New Image
          </button>
        </div>
      </div>

      <div>
        <img
          src={imageUrl}
          alt="Generated"
          className="max-w-[640px] h-auto mx-auto"
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
