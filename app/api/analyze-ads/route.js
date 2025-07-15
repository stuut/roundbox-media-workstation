// app/api/analyze-ads/route.js
import { OpenAI } from "openai";
import { NextResponse } from "next/server";

// Initialize OpenAI
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req) {
  try {
    const body = await req.json();

    const { messages } = body;

    if (!messages) {
      return NextResponse.json({ error: "Missing ads or prompt" }, { status: 400 });
    }


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
