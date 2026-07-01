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

    const environment = await client.environment.get({
          spaceId: spaceId,
          environmentId: environmentId,
    })

      // 3. Create the Asset entry pointing to the external URL
      const asset = await environment.createAsset({
        fields: {
          title: {
            'en-AU': fileName
          },
          file: {
            'en-AU': {
              contentType: fileType, // Match the source file type
              fileName: fileName,
              upload: imagePath // Public URL
            }
          }
        }
      });

      console.log(`Asset created with ID: ${asset.sys.id}. Processing...`);

      // 4. Instruct Contentful to download and process the image file
      const processedAsset = await asset.processForAllLocales();

      // 5. Publish the asset to make it active on the CDN
      const publishedAsset = await processedAsset.publish();

      console.log(`Success! Asset published. URL: ${publishedAsset.fields.file['en-US'].url}`);
      return publishedAsset;

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


    console.log('selectedFeed', selectedFeed)

    const client = contentful.createClient(
    { accessToken: selectedFeed.CMAAccessToken },
    { defaults: { spaceId: selectedFeed.spaceId, environmentId: selectedFeed.environmentId } }
  )


    let publishedImages = [];


    for (let image of images) {
      const imagePath = image.file_url
      const caption = image.caption
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



  }catch(err){
    console.error(err);
    return Response.json(
      { error: "Failed to get contentful data" },
      { status: 500 }
    );
  }

}
