import { createClient } from "@/utils/supabase/server";
var WPAPI = require( 'wpapi' );
import moment from "moment";


async function uploadBase64(wp, imagePath, fileName, fileType, caption) {

  // 2. Convert base64 to a Buffer
  const base64Data = imagePath.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(base64Data, 'base64');

    console.log('fileName', fileName)

  const image = await wp.media()
      // Specify a path to the file you want to upload, or a Buffer
      .file( buffer, fileName)
      .create({
          title: fileName,
          alt_text: caption,
          caption: caption,
          description: caption
      })


    return image
}


async function uploadImageFromUrl(wp, imagePath, fileName, fileType, caption){

  // Fetch the file
    const response = await fetch(imagePath);
    if (!response.ok) {
        throw new Error('Failed to fetch the file');
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const image = await wp.media()
        // Specify a path to the file you want to upload, or a Buffer
        .file(buffer, fileName)
        .create({
            title: fileName,
            alt_text: caption,
            caption: caption,
            description: caption
        })


      return image

}


function isBase64ImagePngOrJpg(url) {
  // Regex matches data:image/[any subtype];base64, followed by valid base64 chars
  const base64ImageRegex = /^data:image\/(png|jpeg|jpg|gif|webp|svg\+xml);base64,/;
  return base64ImageRegex.test(url);
}

export async function POST(req) {

  try {

    const supabase = await createClient();
    const { feedId, images } = await req.json();

    if (!feedId) {
      return Response.json({ message: "No Feed Id" },{ status: 500 })
    }

    const { data, error } = await supabase

    .from("feeds")
    .select(`*`)
    .eq("id", feedId)

      if (error) throw error

      if (!data) {
        return Response.json({ message: "No Feed Data found" },{ status: 500 })
      }

      const selectedFeed = data[0]

      const wpapiUrl = 'https://' + selectedFeed.website + '/wp-json'

      const wp = new WPAPI({
          endpoint: wpapiUrl,
          username: selectedFeed.username,
          password: selectedFeed.password,
      });

      let publishedImages = [];


      for (let image of images) {

        const imagePath = image.file_url
        const caption = image.file_description??''
        const fileName = image.file_name??''
        const fileType = image.file_type??''

        let publishedImage

        if (isBase64ImagePngOrJpg(image.file_url)){
          publishedImage = await uploadBase64(wp, imagePath, fileName, fileType, caption)
        }else{
          publishedImage = await uploadImageFromUrl(wp, imagePath, fileName, fileType, caption)
        }
        publishedImages.push(publishedImage)

      }

      return Response.json({
        data:publishedImages
      },{ status: 200 })


  }catch(err){
    console.error(err);
    return Response.json(
      { error: "Failed to get wordpress data" },
      { status: 500 }
    );
  }
}
