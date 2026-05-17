import { NextResponse } from 'next/server';
import { GoogleGenAI } from "@google/genai"
import { r2Client } from '@/lib/r2'
import { PutObjectCommand } from '@aws-sdk/client-s3'

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb"
    }
  }
}

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_BILLING_API_KEY || ""
})


export async function POST(request) {
  try{

    const { prompt, references } = await req.json();

    const referenceImages = references.map((ref) => ({
      image: { imageBytes: ref.imageBytes, mimeType: ref.mimeType },
      referenceType: "asset",
    }));

    let operation = await ai.models.generateVideos({
        model: "veo-3.1-generate-preview",
        prompt,
        config: { referenceImages },
      });

      // poll...
      while (!operation.done) {
        await new Promise((r) => setTimeout(r, 10000));
        operation = await ai.operations.getVideosOperation({ operation });
      }

      return NextResponse.json({
        videoUrl: operation.response.generatedVideos[0].video
      });


  } catch (err) {
    console.error("Error:", err);
    return NextResponse.json({
      error: "Failed to generate content",
      details: err instanceof Error ? err.message : String(err)
    }, { status: 500 });
  }

}
