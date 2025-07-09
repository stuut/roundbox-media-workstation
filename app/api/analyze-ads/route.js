// app/api/analyze-ads/route.js
import { OpenAI } from "openai";
import { NextResponse } from "next/server";

// Initialize OpenAI
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req) {
  try {
    const body = await req.json();

    const { ads, prompt } = body;

    if (!ads || !prompt) {
      return NextResponse.json({ error: "Missing ads or prompt" }, { status: 400 });
    }

    const messages = [
      {
        role: "system",
        content:
          "You are a helpful and insightful marketing assistant who specializes in Facebook ad performance. You provide clear, data-driven recommendations to optimize campaigns. Prioritize cost-efficiency, conversion rates, and real-world outcomes (like ticket sales).",
      },
      {
        role: "user",
        content: `Here is a list of Facebook ads and ticket sales data:\n\n${JSON.stringify(ads, null, 2)}\n\n${prompt}`,
      },
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-4-0613",
      messages,
    });

    const result = completion.choices[0].message.content;

    return NextResponse.json({ result });
  } catch (error) {
    console.error("OpenAI Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
