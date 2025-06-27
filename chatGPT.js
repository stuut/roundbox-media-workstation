// ✅ 1. Next.js API Route to receive calendar content// File: app/api/receive-calendar/route.js (App Router)

export async function POST(req) {
  const { campaignName, platform, posts } = await req.json();

  // TODO: Save to DB or calendar logic here
  console.log(`Received calendar for ${campaignName} on ${platform}`);
  console.log(posts);

  return Response.json({ success: true });
}


// ✅ 2. Server-side backend function calling OpenAI// Node.js script or Next.js API Route
import OpenAI from 'openai';
import fetch from 'node-fetch';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const functions = [
  {
    name: "send_calendar_to_app",
    description: "Send generated calendar content to the app",
    parameters: {
      type: "object",
      properties: {
        campaignName: { type: "string" },
        platform: { type: "string", enum: ["Facebook", "Instagram"] },
        posts: {
          type: "array",
          items: {
            type: "object",
            properties: {
              date: { type: "string", format: "date" },
              topic: { type: "string" },
              content: { type: "string" },
              time: { type: "string" },
              imageSuggestion: { type: "string" }
            },
            required: ["date", "topic", "content", "time", "imageSuggestion"]
          }
        }
      },
      required: ["campaignName", "platform", "posts"]
    }
  }
];

export async function generateCalendar(prompt) {
  const response = await openai.chat.completions.create({
    model: "gpt-4-0613",
    messages: [
      { role: "system", content: "You generate content calendars for social media campaigns." },
      { role: "user", content: prompt }
    ],
    functions,
    function_call: "auto"
  });

  const functionCall = response.choices[0].message.function_call;

  if (functionCall?.name === 'send_calendar_to_app') {
    const args = JSON.parse(functionCall.arguments);

    const appResponse = await fetch("https://yourdomain.com/api/receive-calendar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(args)
    });

    console.log("App response:", await appResponse.text());
  }
}

// Example usage:
// generateCalendar("Create a 12-month content calendar for Canowindra Balloon Week for Facebook and Instagram")
