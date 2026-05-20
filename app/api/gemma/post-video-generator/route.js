

export async function POST(req) {
  const {text, title} = await req.json();
/*
  Rules:
- Max 7 lines total
- Each line must be one short sentence (under 12 words)
- First line = strong hook
- Next line = context
- Next 3–4 lines = key points
- Final line = conclusion or takeaway
- Use simple, clear language
- No filler words
*/

  const prompt = `
        Turn this article into a short social media script.

        Rules:
          - Maximum 6 scenes.
          - First line = hook.
          - Second line = context.
          - Next 3 lines = key points.
          - Final line = conclusion.
          - Each line must be one short sentence (under 12 words).
          - Do NOT add numbers, "Scene X", or headings.
          - Output JSON array like:
          [
            { "type": "hook", "text": "..." },
            { "type": "context", "text": "..." },
            { "type": "point", "text": "..." },
            { "type": "point", "text": "..." },
            { "type": "point", "text": "..." },
            { "type": "conclusion", "text": "..." }
          ]

        Title:
        """${title}"""

        Article:
        """${text}"""
      `;

  try{

    const response = await fetch("http://localhost:11434/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gemma3",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        stream: false,
        format: "json",
        options: {
          temperature: 0.6,
        },
      }),
    });


    const data = await response.json();

     return Response.json({article: data?.message?.content?.trim() || ""},{status: 200});

  }catch(error){
      console.log(error)
  }

}
