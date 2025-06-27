import OpenAI from 'openai';
import fetch from 'node-fetch';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const calendarTool = {
  name: "send_calendar_to_app",
  description: "Send a generated calendar to the user's app",
  parameters: {
    type: "object",
    properties: {
      platform: {
        type: "string",
        description: "The platform the content is for, e.g. Facebook or Instagram"
      },
      posts: {
        type: "array",
        description: "List of posts with date, topic, content, time and image",
        items: {
          type: "object",
          properties: {
            datetime: {
              type: "string",
              description: "The full date and time to post, in ISO 8601 format (e.g. 2025-06-04T18:30:00)"
            },
            topic: {
              type: "string",
              description: "The topic of the post"
            },
            content: {
              type: "string",
              description: "The full written content for the post"
            },
            image: {
              type: "string",
              description: "A short detailed description of the style of image that can should be used. Describe the scene, style, and subject clearly."
            }
          },
          required: ["date", "topic", "content", "time", "image"]
        }
      }
    },
    required: ["platform", "posts"]
  }
};



export async function POST(req) {
  const { prompt } = await req.json();
  //"Generates a complete 12-month social media content calendar for Facebook and Instagram, including date, time, content, topic, and a detailed image description"

  // Step 1: Classify the intent
  const intentCheck = await openai.chat.completions.create({
    model: "gpt-4-0613",
    messages: [
      { role: "system", content: "You are a classifier. Answer only 'yes' or 'no'." },
      { role: "user", content: `Is the following prompt asking to generate a social media content calendar? "${prompt}"` }
    ]
  });

  const isCalendarPrompt = intentCheck.choices[0].message.content?.toLowerCase().includes("yes");


  console.log('isCalendarPrompt', isCalendarPrompt)


   // Step 2: Main GPT request
  const completion = await openai.chat.completions.create({
      model: "gpt-4-0613",
      messages: [{ role: "user", content: prompt }],
      ...(isCalendarPrompt
        ? { tools: [{ type: "function", function: calendarTool }], tool_choice: { type: "function", function: { name: "send_calendar_to_app" } } }
        : {})
    });

    const message = completion.choices[0].message;


    if (message.tool_calls?.length) {
      const toolCall = message.tool_calls[0];
      if (toolCall.function.name === "send_calendar_to_app") {
        const args = JSON.parse(toolCall.function.arguments);
        console.log('args', args)


        /*

        const fix = await openai.chat.completions.create({
          model: "gpt-4",
          messages: [
            {
              role: "system",
              content: "You are a strict formatter. Fill in missing fields and ensure all data is complete."
            },
            {
              role: "user",
              content: `Please complete this JSON so every post has a date, topic, content, time, and image:\n\n${JSON.stringify(args.posts)}`
            }
          ]
        });
        const fixedPosts = JSON.parse(fix.choices[0].message.content);
        */









        try{
          const appResponse = await fetch("http://localhost:3000/api/receive-calendar", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(args)
          });

          const data = await appResponse.json();

          if (data.success){
            return Response.json({
              result: 'Calendar imported',
            });
          }


        }catch(error){
            console.log(error)
        }

      }
    }else{
      return Response.json({
        result: message.content
      });
    }
}
