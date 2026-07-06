import { NextResponse } from 'next/server';
import { GoogleGenAI } from "@google/genai"

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "20mb"
    }
  }
}
/*
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || ""
})
*/


const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_BILLING_API_KEY || ""
})

const MODEL_ID = "gemini-2.5-flash-image"
//const MODEL_ID = "gemini-3-pro-image-preview"


export async function POST(request) {

  try {

  const { prompt, image: inputImage, history = [] } = await request.json();


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



  const result = await ai.models.generateContent({
    model: MODEL_ID,
    config,
    contents
  })


  const outputImageBase64 = result.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;


  return Response.json({
      image: outputImageBase64 ? `data:${mimeType};base64,${outputImageBase64}` : null,
      description: description || null
    }, { status: 200 })

  } catch (err) {
    console.error("Error:", err)

    return Response.json({
      error: "Failed to generate content",
      details: err instanceof Error ? err.message : String(err)
      }, { status: 500 })

  }

}
