import fs from "node:fs";
import axios from "axios";
import FormData from "form-data";
import path from 'path';
import { r2Client } from '@/lib/r2'
import { PutObjectCommand } from '@aws-sdk/client-s3'

export async function POST(req) {
  try {

    const {imageUrl, fileName, fileType, left, right, up, down, prompt, seed} = await req.json(); // Parses the JSON body

// Fetch the image as an ArrayBuffer
    const imageResponse = await axios.get(imageUrl, { responseType: "arraybuffer" });

    // Convert to a Buffer
    const imageBuffer = Buffer.from(imageResponse.data);

    // Create FormData
    const form = new FormData();
    form.append("image", imageBuffer, {
      filename: `outpaint-${fileName}`, // important to set a filename
      contentType: fileType,          // content type
    });
    form.append("left", left);
    form.append("right", right);
    form.append("up", up);
    form.append("down", down);
    form.append("output_format", "jpeg");
    if (prompt){
      form.append("prompt", prompt);
    }
    if (seed){
      form.append("seed", seed);
    }



    // Send to Stability API
    const response = await axios.post(
      `https://api.stability.ai/v2beta/stable-image/edit/outpaint`,
      form,
      {
        headers: {
          ...form.getHeaders(),
          Authorization: `Bearer ${process.env.STABILITY_API_KEY}`,
          Accept: "image/*",
        },
        responseType: "arraybuffer",
        validateStatus: undefined,
      }
    );

    if (response.status === 200) {
      const saveDir = path.join(process.cwd(), 'public', 'edit-images');

      fs.writeFileSync(`${saveDir}/outpaint-${fileName}`, Buffer.from(response.data));


      const buffer = Buffer.from(response.data)

      let NewfileName = `${Date.now()}-${fileName}`

      const command = new PutObjectCommand({
        Bucket: process.env.R2_PUBLIC_BUCKET,
        Key: NewfileName,
        Body: buffer,
        ContentType: 'image/jpeg',
        ACL: 'public-read', // optional
      })
      await r2Client.send(command)

      const fileUrl = `${process.env.R2_PUBLIC_URL}/${fileName}`

      return response.json({ success: true, url: fileUrl, fileName: NewfileName},{ status: 200 })


    } else {
      throw new Error(`${response.status}: ${response.data.toString()}`);
    }


  } catch (err) {
    console.error(err);
    return Response.json(
      { error: 'Failed to process image' },
      { status: 500 }
    );
  }
}
