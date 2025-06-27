"use client"
import { useCallback, useState, useEffect } from "react"
import { useDropzone } from "react-dropzone"

export function formatFileSize(bytes) {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

export function ImageUpload({ onImageSelect, currentImage }) {
  const [selectedFile, setSelectedFile] = useState(null)

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

      // Convert the file to base64
      const reader = new FileReader()
      reader.onload = event => {
        if (event.target && event.target.result) {
          const result = event.target.result
          console.log("Image loaded, length:", result.length)
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
    accept: ['.jpg', '.png'],
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false
  })

  const handleRemove = () => {
    setSelectedFile(null)
    onImageSelect("")
  }

  return (
    <div className="w-full">
      {!currentImage ? (
        <div
          {...getRootProps()}
          className={`
          ${isDragActive ? "bg-secondary/50" : "bg-secondary"}
          transition-colors
        `}
        >
          <input {...getInputProps()} />
          <div>
            <div>
              <p>
                Drop your image here or click to browse
              </p>
              <p>
                Maximum file size: 10MB
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div>
          <div>
            <div>
              <p>
                {selectedFile?.name || "Current Image"}
              </p>
              {selectedFile && (
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(selectedFile?.size ?? 0)}
                </p>
              )}
            </div>
            <button
              variant="ghost"
              size="icon"
              onClick={handleRemove}
            >
              <span>Remove image</span>
            </button>
          </div>
          <div>
            <img
              src={currentImage}
              alt="Selected"
            />
          </div>
        </div>
      )}
    </div>
  )
}
