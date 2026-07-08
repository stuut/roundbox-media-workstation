import OpenAI from "openai";
import { NextResponse } from 'next/server';


const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const platforms = {
  facebook:  { label: "Facebook",    limit: 3000, norms: "conversational, hot-take feel, no hashtags needed" },
  twitter:   { label: "X / Twitter", limit: 280,  norms: "punchy hook, max 2 hashtags, conversational, under 280 characters" },
  linkedin:  { label: "LinkedIn",    limit: 3000, norms: "professional but human, short hook, whitespace, 3-5 hashtags at end, ends with a question" },
  instagram: { label: "Instagram",   limit: 2200, norms: "visual language, short sentences, 2-4 emojis, 5-10 hashtags at end" },
  threads:   { label: "Threads",     limit: 500,  norms: "conversational, hot-take feel, no hashtags needed, max 500 characters" },
};

const tones = {
  professional:  "authoritative, polished, data-forward",
  casual:        "warm, friendly, like texting a smart friend",
  witty:         "clever, light humour, unexpected angle",
  inspirational: "motivating, forward-looking, emotionally resonant",
  urgent:        "direct, no fluff, action-oriented",
};

export async function POST(req){

    try {

      const { caption, platform, tone } = await req.json();

      const p = platforms[platform];


      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        max_tokens: 300,
        temperature: 0.8, // ✅ makes posts sound more natural
        messages: [
          {
            role: "system",
            content: "You are a precise social media copywriting assistant. Always respond in British English, using UK spelling and grammar conventions.",
          },
          {
            role: "user",
            content: `
              Rewrite the following caption as a ${p.label} post.

              Platform norms: ${p.norms}
              Character limit: ${p.limit} characters
              Tone: ${selectedTone}

              Rules:
              - Return ONLY the rewritten post
              - Do not explain anything
              - Do not include labels like "Here is your post"

              Caption:
              ${caption}
            `.trim(),
          },
        ],
        });

        const message = completion.choices[0]?.message?.content?.trim() || "";



        return NextResponse.json({ rewritten: message  }, {status: 200})

    } catch (err) {
      console.error("Error:", err);
      return NextResponse.json({ error: "Failed to generate content"  }, {status: 500})
    }

}
