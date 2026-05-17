import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from 'next/server';


const client = new Anthropic({ apiKey: "your-api-key" });

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

      const { articleText, platform, tone } = await req.json();

      const p = platforms[platform];

      const response = await client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        messages: [
          {
            role: "user",
            content: `You are a social media copywriter. Summarize the following article as a ${p.label} post.

            Platform norms: ${p.norms}
            Character limit: ${p.limit} characters (strict — do not exceed this)
            Tone: ${tones[tone]}

            Return ONLY the post text. No preamble, no explanation.

            Article:
            ${articleText}`,
                  },
                ],
        });


        return NextResponse.json({ text: response.content[0].text  }, {status: 200})

    } catch (err) {
      console.error("Error:", err);
      return NextResponse.json({ error: "Failed to generate content"  }, {status: 500})
    }

}
