import sharp from 'sharp';
import axios from "axios";

export async function POST(req) {

  try {
    const {file_url} = await req.json(); // Parses the JSON body

    // Fetch the image as an ArrayBuffer
    const imageResponse = await axios.get(file_url, { responseType: "arraybuffer" });

        // Convert to a Buffer
    const imageBuffer = Buffer.from(imageResponse.data);


    const sharpenFile = await sharp(imageBuffer)
      .sharpen() // Applies a fast, standard sharpen filter
      .toBuffer();

    return Response.json({
      image:sharpenFile
    },{status: 200});


  } catch (err) {
    return Response.json({
      error: "Failed to extract PDF region",
      details: err.message,
    },{status: 500});
  }


}
