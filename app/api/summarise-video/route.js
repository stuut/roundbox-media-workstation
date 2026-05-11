import OpenAI from "openai";
import { NextResponse } from 'next/server';


console.log('process.env.OPENAI_API_KEY', process.env.OPENAI_API_KEY)

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {

  if (req.method !== "POST") {
    return NextResponse.json({ error: 'Method Not Allowed' }, { status: 405 })

  }

  try {




    //const { text } = req.body;

    const { text } = await req.json();

        console.log('text', text)


    if (!text || typeof text !== "string") {

      return NextResponse.json({ error: 'Missing or invalid text field' }, { status: 400 })
    }

    const prompt = `
      Create an engaging video reel post caption (1–3 short paragraphs) for either Instagram or facebook from the following article text.
      Keep it conversational, informative and visually appealing with emojis and short sentences.

      Text:
      """${text}"""
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // ✅ use latest model (faster, cheaper, higher quality)
      messages: [{ role: "user", content: prompt }],
      temperature: 0.8, // ✅ makes posts sound more natural
      max_tokens: 300, // ✅ prevents overly long responses
      //max_completion_tokens: 300,  // ✅ prevents overly long responses with gpt-5
    });

    const message = completion.choices[0]?.message?.content?.trim() || "";

    return NextResponse.json({ post: message  }, {status: 200})


  } catch (err) {
    console.error("Error:", err);
    return NextResponse.json({ error: "Failed to generate content"  }, {status: 500})
  }
}
