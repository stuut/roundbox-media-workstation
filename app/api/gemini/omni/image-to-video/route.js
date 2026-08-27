import { GoogleGenAI } from "@google/genai"

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "20mb"
    }
  }
}

function getMimeType(dataUrl) {
  // dataUrl format: "data:image/png;base64,iVBOR..."
  return dataUrl.split(';')[0].split(':')[1];
}

function getBase64(dataUrl) {
    return dataUrl.split(",")[1];
}

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_BILLING_API_KEY || ""
})

export async function POST(request) {

    const { aspect_ratio, prompt, image, previous_interaction_id } = await request.json();
    if (!prompt) {
        return request.status(400).json({ error: "Prompt is required" })
    }

    let input = [
      { type: "text", text: prompt },
    ];

    if (image){
        input.push({
                type: "image",
                mime_type: getMimeType(image),
                data: getBase64(image)
            })
    }

    /*
    No images → text_to_video
    One image to animate → image_to_video
    One or more images used only for identity/style/objects → reference_to_video
    Existing video → edit
    */

    let task = 'text_to_video'

    if (previous_interaction_id){
        task = 'edit'
    }else if (image){
        task = 'image_to_video'
        //task = 'reference_to_video'
    }


    const mimeType = 'video/mp4'

    const validRatios = ["16:9", "9:16"];

    const ratio = validRatios.includes(aspect_ratio)
        ? aspect_ratio
        : "16:9";



  const data = {
    model: "gemini-omni-flash-preview",
    input: input,
    response_format: {
        type: 'video', // optional
        aspect_ratio: ratio // Supported values: '9:16', '16:9'
    },
    generation_config: {
        video_config: {
        task: task,
        }
    }
  }


  if (previous_interaction_id){
    data.previous_interaction_id = previous_interaction_id
  }



    try {

        const interaction = await ai.interactions.create(data);

        const generatedVideo = interaction.output_video;

        if (generatedVideo) {

            return Response.json({
                video: `data:${mimeType};base64,${generatedVideo.data}`,
                description: prompt,
                interactionId: interaction.id
            }, { status: 200 })


        }

     } catch (err) {

    return Response.json({
      error: "Failed to generate content",
      details: err instanceof Error ? err.message : String(err)
      }, { status: 500 })

  }


}