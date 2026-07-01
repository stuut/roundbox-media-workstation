import { createClient as supabaseClient } from "@/utils/supabase/server";
import moment from "moment";
const contentful = require('contentful-management');

function createSlug(string) {
  return string
      .toLowerCase() // Convert to lowercase
      .trim() // Remove whitespace from both ends
      .replace(/[^a-z0-9\s-]/g, '') // Remove all non-alphanumeric characters except spaces and hyphens
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-'); // Replace multiple hyphens with a single hyphen
}


export async function POST(req) {

try {

  const {
    feedId,
    heading,
    authorId,
    publishDate,
    scheduleDate,
    imageField,
    imageId,
    text,
    textField,
    categories,
    tags
  } = await req.json();


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



    var categoriesArray = []
    var tagsArray = []


      const categoriesArray = categories.map((category)=>{
        return {
            sys: {
              type: 'Link',
              linkType: 'Entry',
              id: category,
            }
        }
      })


      const tagsArray = tags.map((tag)=>{
        return {
            sys: {
              type: 'Link',
              linkType: 'Entry',
              id: tag,
            }
        }
      })

      let uploadData = {
        title: { 'en-AU': heading },
        slug: { 'en-AU' : createSlug(heading)},
        [textField]: { 'en-AU': text },
        publishDate: { 'en-AU': publishDate },
        scheduleDate: { 'en-AU': scheduleDate },
        ...(imageId && {
          [imageField]: {
            'en-AU': {
              sys: {
                type: 'Link',
                linkType: 'Asset',
                id: imageId,
              },
            },
          },
        }),
        ...(authorId && {
          author: {
            'en-AU': {
              sys: {
                type: 'Link',
                linkType: 'Entry',
                id: authorId,
              },
            },
          },
        }),
        ...(categories && {
          categories: {
              'en-AU': categoriesArray
            }
          }),
        ...(tags && {
          tags: {
              'en-AU': tagsArray
            }
          })
      };


      const entry = await client.entry.create(
        { spaceId: selectedFeed.spaceId, environmentId: selectedFeed.environmentId, contentTypeId: 'post' },
        {
          fields: uploadData,
        }
      )

      const post = await client.entry.publish(
        { spaceId: selectedFeed.spaceId, environmentId: selectedFeed.environmentId, entryId: entry.sys.id },
        entry
      )

      return Response.json({
        data:post
      },{ status: 200 })

  }catch(err){
    console.error(err);
    return Response.json(
      { error: "Failed to get contentful data" },
      { status: 500 }
    );
  }

}
