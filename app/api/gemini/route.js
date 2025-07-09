import { NextResponse } from 'next/server';
import { GoogleGenAI } from "@google/genai"

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb"
    }
  }
}

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || ""
})

const MODEL_ID = "gemini-2.0-flash-preview-image-generation"


export async function POST(request) {



  try {

  const { prompt, image: inputImage, history = [] } = await request.json();


  console.log('prompt', prompt)
  console.log('image', inputImage)
    console.log('history', history)



  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" })
  }

  const contents = []

  // Add history if exists
  for (const item of history) {
    const formattedParts = item.parts.map(part => {
      if (part.text) {
        return { text: part.text }
      } else if (part.image) {
        const [meta, base64Data] = part.image.split(",")
        const mimeType = meta.includes("image/png")
          ? "image/png"
          : "image/jpeg"
        return {
          inlineData: {
            data: base64Data,
            mimeType
          }
        }
      }
      return { text: "" }
    })

    contents.push({
      role: item.role,
      parts: formattedParts
    })
  }

  // Add current user message
  const currentParts = [{ text: prompt }]
  if (inputImage && inputImage.startsWith("data:")) {
    const [meta, base64Data] = inputImage.split(",")
    const mimeType = meta.includes("image/png") ? "image/png" : "image/jpeg"

    currentParts.push({
      inlineData: {
        data: base64Data,
        mimeType
      }
    })
  }

  contents.push({
    role: "user",
    parts: currentParts
  })

  const config = {
    responseModalities: ["IMAGE", "TEXT"],
    responseMimeType: "text/plain"
  }



  const responseStream = await ai.models.generateContentStream({
    model: MODEL_ID,
    config,
    contents
  })

  let description = ""
  let imageData = null
  let mimeType = null

  for await (const chunk of responseStream) {
    const parts = chunk?.candidates?.[0]?.content?.parts
    if (!parts) continue

    for (const part of parts) {
      if (part.text) {
        description += part.text
      } else if (part.inlineData) {
        imageData = part.inlineData.data
        mimeType = part.inlineData.mimeType || "image/png"

        // Optional: Save to file system
        // const buffer = Buffer.from(imageData, 'base64');
        // await writeFile(`output.${mime.getExtension(mimeType)}`, buffer);
      }
    }
  }


  return NextResponse.json({
      image: imageData ? `data:${mimeType};base64,${imageData}` : null,
      description: description || null
    }, { status: 200 })

  } catch (err) {
    console.error("Error:", err)

    return NextResponse.json({
      error: "Failed to generate content",
      details: err instanceof Error ? err.message : String(err)
      }, { status: 500 })

  }

}
