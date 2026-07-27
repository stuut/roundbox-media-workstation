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

function getMimeType(dataUrl) {
  // dataUrl format: "data:image/png;base64,iVBOR..."
  return dataUrl.split(';')[0].split(':')[1];
}


const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_BILLING_API_KEY || ""
})


export async function POST(request) {

  try {

  const { aspect_ratio, prompt, image, previous_interaction_id } = await request.json();




  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" })
  }

  if (image){
    prompt.push({
            type: "image",
            mime_type: getMimeType(image),
            data: image
          })
  }

    let input = [
      { type: "text", text: prompt },
    ];

  const mimeType = 'image/jpeg'

  const data = {
    model: "gemini-3.1-flash-lite-image",
    input: input,
    response_format: {
      type: "image",
      mime_type: mimeType,
      aspect_ratio: aspect_ratio,
      image_size: "1K"
    },
  }


  if (previous_interaction_id){
    data.previous_interaction_id = previous_interaction_id
  }

  const interaction = await ai.interactions.create(data);
  const generatedImage = interaction.output_image;
  if (generatedImage) {
   //const buffer = Buffer.from(generatedImage.data, "base64");
   return Response.json({
       image: `data:${mimeType};base64,${generatedImage.data}`,
       description: prompt,
       interactionId: interaction.id
     }, { status: 200 })
 }else{

   return Response.json({
       image: null,
       message: 'no image'
     }, { status: 500 })

 }




  } catch (err) {
    console.error("Error:", err)

    return Response.json({
      error: "Failed to generate content",
      details: err instanceof Error ? err.message : String(err)
      }, { status: 500 })

  }

}
