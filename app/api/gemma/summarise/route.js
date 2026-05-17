export async function POST(req) {
  try {
    const { caption, platform, tone } = await req.json();

    const platforms = {
      facebook:  { label: "Facebook", limit: 2200, norms: "conversational, hot-take feel, no hashtags needed" },
      twitter:   { label: "X / Twitter", limit: 280, norms: "punchy hook, max 2 hashtags, conversational, under 280 characters" },
      linkedin:  { label: "LinkedIn", limit: 3000, norms: "professional but human, short hook, whitespace, 3-5 hashtags at end, ends with a question" },
      instagram: { label: "Instagram", limit: 2200, norms: "visual language, short sentences, 2-4 emojis, 5-10 hashtags at end" },
      threads:   { label: "Threads", limit: 500, norms: "conversational, hot-take feel, no hashtags needed, max 500 characters" },
    };

    const tones = {
      professional: "authoritative, polished, data-forward",
      casual: "warm, friendly, like texting a smart friend",
      witty: "clever, light humour, unexpected angle",
      inspirational: "motivating, forward-looking, emotionally resonant",
      urgent: "direct, no fluff, action-oriented",
    };

    const p = platforms[platform] || platforms.facebook;
    const selectedTone = tones[tone] || tones.casual;



    const response = await fetch("http://localhost:11434/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gemma3",
        messages: [
          {
            role: "system",
            content: "You are a precise social media copywriting assistant.",
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
        stream: false,
        options: {
          temperature: 0.6,
        },
      }),
    });

    const data = await response.json();

    console.log('data', data)

    return Response.json({
      rewritten: data.message.content,
    });

  } catch (err) {
    console.error(err);
    return Response.json(
      { error: "Failed to rewrite caption" },
      { status: 500 }
    );
  }
}
