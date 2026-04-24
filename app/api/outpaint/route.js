import fs from "node:fs";
import axios from "axios";
import FormData from "form-data";
import path from 'path';


export async function POST(req) {
  try {

    const body = await req.json(); // Parses the JSON body

    const imageUrl = body.imageUrl ;

// Fetch the image as an ArrayBuffer
    const imageResponse = await axios.get(imageUrl, { responseType: "arraybuffer" });

    // Convert to a Buffer
    const imageBuffer = Buffer.from(imageResponse.data);

    // Create FormData
    const form = new FormData();
    form.append("image", imageBuffer, {
      filename: "husky-in-a-field.png", // important to set a filename
      contentType: "image/png",          // content type
    });
    form.append("left", 200);
    form.append("down", 200);
    form.append("output_format", "webp");

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

      fs.writeFileSync(`${saveDir}/husky-in-a-huge-field.webp`, Buffer.from(response.data));
    } else {
      throw new Error(`${response.status}: ${response.data.toString()}`);
    }


    return NextResponse.json({
      success: true,
      data: response.data, // usable in frontend
    });


  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: 'Failed to process image' },
      { status: 500 }
    );
  }
}
