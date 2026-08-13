import { GoogleGenAI } from "@google/genai"

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "20mb"
    }
  }
}

function getMimeType(dataUrl) {
  // dataUrl format: "data:image/png;base64,iVBOR..."
  return dataUrl.split(';')[0].split(':')[1];
}

export async function POST(request) {

    try {

     } catch (err) {

    return Response.json({
      error: "Failed to generate content",
      details: err instanceof Error ? err.message : String(err)
      }, { status: 500 })

  }


}