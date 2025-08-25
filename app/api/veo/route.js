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


function fileToGenerativePart(base64) {
  const match = base64.match(/^data:(.+);base64,(.+)$/)
  if (!match) {
    throw new Error("Invalid base64 string")
  }
  const mimeType = match[1]
  const data = match[2]

  return {
      mimeType,
      data
  }
}



export async function POST(request) {
  try{

    const { prompt, image} = await request.json();

    const requestPayload = {
      model: 'veo-3.0-generate-preview',
      prompt,
      config: {
        numberOfVideos: 1,
        aspectRatio: '16:9',
        durationSeconds: 8,
      },
    };

    if (image) {
      const imageInfo = fileToGenerativePart(image);
      requestPayload.image = {
        imageBytes: imageInfo.data,
        mimeType: imageInfo.mimeType,
      };
    }


    let operation = await ai.models.generateVideos(requestPayload);

        while (!operation.done) {
          console.log(`Waiting for video generation...`);
          await new Promise((resolve) => setTimeout(resolve, 10000));
          operation = await ai.operations.getVideosOperation({ operation });
        }

        const uploadedVideos = [];

        const generatedVideos = operation.response?.generatedVideos || [];
        for (let i = 0; i < generatedVideos.length; i++) {
          const generatedVideo = generatedVideos[i];
          const videoUri = `${generatedVideo.video.uri}&key=${process.env.GEMINI_BILLING_API_KEY}`;
          const response = await fetch(videoUri);
          const arrayBuffer = await response.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);

          const fileName = `${Date.now()}-video_${i}.mp4`;
          const uploadCommand = new PutObjectCommand({
            Bucket: process.env.R2_PUBLIC_BUCKET,
            Key: fileName,
            Body: buffer,
            ContentType: 'video/mp4',
            ACL: 'public-read',
          });

          await r2Client.send(uploadCommand);
          const fileUrl = `${process.env.R2_PUBLIC_URL}/${fileName}`;
          uploadedVideos.push({
            file_type: 'video/mp4',
            file_url:fileUrl,
            file_name:fileName
          });
        }

        return NextResponse.json({ videos: uploadedVideos }, { status: 200 });

  } catch (err) {
    console.error("Error:", err);
    return NextResponse.json({
      error: "Failed to generate content",
      details: err instanceof Error ? err.message : String(err)
    }, { status: 500 });
  }

}
