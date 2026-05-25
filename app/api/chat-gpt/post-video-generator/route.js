import OpenAI from 'openai';
import fetch from 'node-fetch';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });


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

     const completion = await openai.chat.completions.create({
       model: "gpt-4o", // ✅ use latest model (faster, cheaper, higher quality)
       messages: [
         {role: "system", content: "You are a helpful assistant. Always respond in British English, using UK spelling and grammar conventions."},
         { role: "user", content: prompt }
       ],
       temperature: 0.8, // ✅ makes posts sound more natural
       max_tokens: 300, // ✅ prevents overly long responses
       response_format: {
          type: "json_schema",
          json_schema: {
            name: "social_media_script",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                scenes: {
                  type: "array",
                  minItems: 6,
                  maxItems: 6,
                  items: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                      type: {
                        type: "string",
                        enum: [
                          "hook",
                          "context",
                          "point",
                          "conclusion"
                        ]
                      },
                      text: {
                        type: "string",
                        maxLength: 80
                      }
                    },
                    required: ["type", "text"]
                  }
                }
              },
              required: ["scenes"]
            }
          }
        },
       //max_completion_tokens: 300,  // ✅ prevents overly long responses with gpt-5
     });

     const message = completion.choices[0]?.message?.content?.trim() || "";

     return Response.json({article: message},{status: 307});

  }catch(error){
      console.log(error)
  }

}
