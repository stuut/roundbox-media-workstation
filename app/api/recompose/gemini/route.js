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


export async function POST(request) {

  const {image, aspectRatio, resolution, speed} = await request.json();

    try {

      // Load image (in reality this is a Buffer or base64)
        const image = await fetch("input.png").then(res => res.arrayBuffer());

        //"1K", "2K", "4K"
        //"square": "1:1",
   //"story": "9:16",
   //"landscape": "16:9"


        const model = speed === 'fast'?'nano-banana-2':'gemini-3-pro-image-preview'

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
        const result = await ai.models.generateContent({
          model: "gemini-3-pro-image-preview",

          contents: [
            {
              role: "user",
              parts: [
                { text: userPrompt },
                {
                  inlineData: {
                    data: Buffer.from(image).toString("base64"),
                    mimeType: "image/png",
                  },
                },
              ],
            },
          ],

          config: {
            // These correspond to your ComfyUI primitives
            systemInstruction: systemInstruction + "\n\n" + runtimeInstruction,

            generationConfig: {
              aspectRatio: aspectRatio,
              outputResolution: resolution,
            },
          },
        });

        // ------------------------------
        // OUTPUT
        // ------------------------------
        const outputImageBase64 = result.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

        console.log("Generated image received");

        return Response.json({
            image: outputImageBase64 ? `data:${mimeType};base64,${outputImageBase64}` : null,
            description: description || null
          }, { status: 200 })

    }catch (err){

      return Response.json({
        error: "Failed to generate content",
        details: err instanceof Error ? err.message : String(err)
        }, { status: 500 })

    }





}
