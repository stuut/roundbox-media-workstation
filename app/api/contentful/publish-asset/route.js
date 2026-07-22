import { createClient as supabaseClient } from "@/utils/supabase/server";
import moment from "moment";
const contentful = require('contentful-management');


async function uploadBase64(client, imagePath, fileName, fileType, caption, spaceId, environmentId) {


  // 2. Convert base64 to a Buffer
  const base64Data = imagePath.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(base64Data, 'base64');

  const upload = await client.upload.create(
    { spaceId: spaceId },
    { file: buffer }
  )


  const asset = await client.asset.create(
    {},
    {
      fields: {
        title: { 'en-AU': fileName },
        description: { 'en-AU': caption },
        file: {
          'en-AU': {
            contentType: fileType,
            fileName: fileName,
            uploadFrom: { sys: { type: 'Link', linkType: 'Upload', id: upload.sys.id } },
          },
        },
      },
    }
  )


  // Step 3 & 4: Process then publish
  const processedAsset =  await client.asset.processForAllLocales({}, asset)  // ✅ pass asset directly
  const publishedAsset = await client.asset.publish(
    { assetId: processedAsset.sys.id },
    processedAsset
  )

return publishedAsset

}

async function uploadImageFromUrl(client, imagePath, fileName, fileType, caption, spaceId, environmentId) {

    // 2. Fetch target Space and Environment


      // 3. Create the Asset entry pointing to the external URL
      const asset = await client.asset.create(
        {},
        {
          fields: {
            title: { 'en-AU': fileName },
            description: { 'en-AU': caption },
            file: {
              'en-AU': {
                contentType: fileType,
                fileName: fileName,
                upload: imagePath,
              },
            },
          },
        }
      )

      // Step 3 & 4: Process then publish


      const processedAsset =  await client.asset.processForAllLocales({}, asset)



      const publishedAsset = await client.asset.publish({ assetId: processedAsset.sys.id }, processedAsset)

    return publishedAsset

}


function isBase64ImagePngOrJpg(url) {
  // Regex matches data:image/[any subtype];base64, followed by valid base64 chars
  const base64ImageRegex = /^data:image\/(png|jpeg|jpg|gif|webp|svg\+xml);base64,/;
  return base64ImageRegex.test(url);
}


export async function POST(req) {

try {

  const { feedId, images } = await req.json();


  if (!feedId) {
    return Response.json({ message: "No Feed Id" },{ status: 500 })
  }

  const supabase = await supabaseClient();


  const { data, error } = await supabase

  .from("feeds")
  .select(`*`)
  .eq("id", feedId)

    if (error) throw error

    if (!data) {
      return Response.json({ message: "No Feed Data found" },{ status: 500 })
    }

    const selectedFeed = data[0]


    const client = contentful.createClient(
    { accessToken: selectedFeed.CMAAccessToken },
    { defaults: { spaceId: selectedFeed.spaceId, environmentId: selectedFeed.environmentId } }
  )


    let publishedImages = [];


    for (let image of images) {
      const imagePath = image.file_url
      const caption = image.file_description??''
      const fileName = image.file_name
      const fileType = image.file_type

      let publishedImage
      if (isBase64ImagePngOrJpg(image.file_url)){
        publishedImage = await uploadBase64(client, imagePath, fileName, fileType, caption, selectedFeed.spaceId, selectedFeed.environmentId)
      }else{
        publishedImage = await uploadImageFromUrl(client, imagePath, fileName, fileType, caption, selectedFeed.spaceId, selectedFeed.environmentId)
      }
      publishedImages.push(publishedImage)
    }

    return Response.json({
      data:publishedImages
    },{ status: 200 })


} catch (err) {
  console.error("========== ERROR ==========");
  console.error("Message:", String(err?.message || ""));
  console.error("Name:", String(err?.name || ""));
  console.error("Status:", String(err?.status || ""));
  console.error("Status Code:", String(err?.statusCode || ""));
  console.error("Stack:", String(err?.stack || ""));
  console.error("===========================");

  return Response.json(
    {
      error: "Failed to get contentful data",
      details: String(err?.message || "Unknown error"),
    },
    { status: 500 }
  );
}

}
