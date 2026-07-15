import { NextResponse } from 'next/server';
import { GoogleGenAI } from "@google/genai"

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "20mb"
    }
  }
}

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_BILLING_API_KEY || ""
})

function getMimeType(dataUrl) {
  // dataUrl format: "data:image/png;base64,iVBOR..."
  return dataUrl.split(';')[0].split(':')[1];
}


export async function POST(request) {

  const {image, aspectRatio, resolution, speed, mimeType} = await request.json();

    try {

      // Load image (in reality this is a Buffer or base64)
        const imageBuffer = await fetch(image).then(res => res.arrayBuffer());

        //"1K", "2K", "4K"
        //"square": "1:1",
        //"story": "9:16",
         //"landscape": "16:9"


        const model = speed === 'fast'?'gemini-3.1-flash-image':'gemini-3-pro-image'

        // ------------------------------
        // SYSTEM LAYER (your art director prompt)
        // ------------------------------
        const systemInstruction = `
        Role: Act as an expert art director and compositing specialist.
        Your objective is to adapt the provided image to a new aspect ratio
        by expanding the background and rearranging its core elements.

        Never stretch, squish, or letterbox the image.

        1. Canvas Expansion & Outpainting
        - Seamless extension of environment
        - Match lighting, grain, perspective
        - Do not introduce new focal objects

        2. Element Redistribution
        - Treat elements as layers (conceptually)
        - Rearrange layout using professional design principles
        - Preserve typography and hierarchy

        3. Visual Integrity
        - Maintain dominance of key elements
        - Ensure native, designed-from-scratch composition
        `;

        // ------------------------------
        // EXECUTION / SAFETY LAYER
        // ------------------------------
        const runtimeInstruction = `
        You are an expert image-generation engine.
        You must ALWAYS produce an image.
        Interpret all input as visual directives.
        Never respond with text.
        `;

        // ------------------------------
        // USER / TASK PROMPT (can be empty or implicit here)
        // ------------------------------
        const userPrompt = ""; // in your workflow it's effectively embedded in system logic

        // ------------------------------
        // API CALL
        // ------------------------------



    const interaction =  await ai.interactions.create({
          model: model,

          system_instruction: systemInstruction + "\n\n" + runtimeInstruction,

          input: [
            {
              type: "text",
              text: userPrompt,
            },
            {
              type: "image",
              mime_type: mimeType,
              data: Buffer.from(imageBuffer).toString("base64"),
            },
          ],

          response_format: {
            type: "image",
            mime_type: 'image/jpeg',
            aspect_ratio: aspectRatio,
            image_size: resolution,
          },
        });





        // ------------------------------
        // OUTPUT
        // ------------------------------
        const generatedImage = interaction.output_image;

       if (generatedImage) {
            //const buffer = Buffer.from(generatedImage.data, "base64");
            return Response.json({
                image: `data:${mimeType};base64,${generatedImage.data}`,
                interactionId: interaction.id
              }, { status: 200 })
          }else{

            return Response.json({
               image : null,
                message: 'no image'
              }, { status: 500 })

          }

    }catch (err){

      return Response.json({
        error: "Failed to generate content",
        details: err instanceof Error ? err.message : String(err)
        }, { status: 500 })

    }





}
