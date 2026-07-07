import { DesignSchema } from "@/lib/design-schema"
import * as z from 'zod'
import { zodToJsonSchema } from "zod-to-json-schema"




export async function POST(req) {


  console.log('DesignSchema', DesignSchema)


  const {prompt} = await req.json();

  try{

    const response = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gemma4',
        messages: [
          {
            role: "system",
            content: `
          You are a design system compiler.
          Return ONLY valid JSON matching the schema.
          No explanation.
          No markdown.
        `
          },
          {
            role: "user",
            content: prompt
          }
        ],
        stream: false,
        format: zodToJsonSchema(DesignSchema),
        options: {
          temperature: 0,
          num_predict: 2048, // or higher, depending on how large `elements` can get
        }
      })
    })


    const data = await response.json();
    //console.log("RAW:", data.message?.content)

    const parsedJSON = JSON.parse(data.message.content)
    //console.log("PARSED:", parsedJSON)

    const design = DesignSchema.safeParse(parsedJSON)

    return Response.json({data:design},{status: 200});

  } catch (error) {
    console.log(error)
    return Response.json({ error: error.message }, { status: 500 })
  }

}
