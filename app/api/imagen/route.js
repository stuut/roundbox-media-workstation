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
  apiKey: process.env.GEMINI_API_KEY || ""
})


export async function POST(request) {

    try {
      const { prompt } = await request.json();

      const response = await ai.models.generateImages({
        model: 'models/imagen-4.0-generate-preview-06-06',
        prompt: prompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/jpeg',
          aspectRatio: '1:1',
        },
      });

      if (!response?.generatedImages) {
        console.error('No images generated.');
        return;
      }

      if (response.generatedImages.length !== 1) {
        console.error('Number of images generated does not match the requested number.');
      }

      const uploadedImages = [];

      for (let i = 0; i < response.generatedImages.length; i++) {
        if (!response.generatedImages?.[i]?.image?.imageBytes) {
          continue;
        }

        const fileName = `${Date.now()}-imagen_${i}.jpeg`;
        const uploadCommand = new PutObjectCommand({
          Bucket: process.env.R2_PUBLIC_BUCKET,
          Key: fileName,
          Body: response?.generatedImages?.[i]?.image?.imageBytes,
          ContentType: 'video/mp4',
          ACL: 'public-read',
        });

        await r2Client.send(uploadCommand);
        const fileUrl = `${process.env.R2_PUBLIC_URL}/${fileName}`;

        uploadedImages.push({
          file_type: 'image/jpeg',
          file_url:fileUrl,
          file_name:fileName
        });

      }

      return NextResponse.json({
          images: uploadedImages,
        }, { status: 200 })

} catch (err) {
  console.error("Error:", err)

  return NextResponse.json({
    error: "Failed to generate content",
    details: err instanceof Error ? err.message : String(err)
    }, { status: 500 })

}



}
