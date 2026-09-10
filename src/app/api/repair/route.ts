import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const REPAIR_SYSTEM_INSTRUCTION = `You are an automated self-healing debugger in Playground.
A generated HTML5 game/app crashed during runtime execution or has a syntax error.

Your job is to diagnose the error and return the corrected, complete, working HTML document.

DIAGNOSTIC RULES:
1. First output a brief <agent_plan> section explaining what caused the bug and how you fixed it:
   <agent_plan>
   [Diagnosis] Exact reason for crash (e.g. unhandled null pointer on canvas context, typo in variable)
   [Fix] How the bug was resolved
   </agent_plan>
2. Follow immediately with the corrected complete HTML document: <!DOCTYPE html> ... </html>.
3. Ensure no new dependencies are introduced.
4. Keep all existing gameplay and visual styles intact while fixing the crash.
`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, error, prompt, apiKey: clientApiKey, model: requestedModel } = body;

    if (!code || !error) {
      return NextResponse.json({ error: 'Code and error details are required' }, { status: 400 });
    }

    const apiKey = clientApiKey || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'No Gemini API key provided. Please configure it in Settings.' },
        { status: 401 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });
    const model = requestedModel || process.env.GEMINI_MODEL || 'gemini-2.0-flash-lite';

    const repairPrompt = `Game prompt: "${prompt || 'Interactive mini game'}"

Runtime Error Reported:
Message: ${error.message}
Line: ${error.lineno || 'unknown'}
Column: ${error.colno || 'unknown'}
Stack trace:
${error.stack || 'No stack trace provided'}

Broken Code:
\`\`\`html
${code}
\`\`\`

Fix this error and return the full working HTML code.`;

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const responseStream = await ai.models.generateContentStream({
            model: model,
            contents: repairPrompt,
            config: {
              systemInstruction: REPAIR_SYSTEM_INSTRUCTION,
              temperature: 0.3, // Lower temperature for debugging precision
            },
          });

          for await (const chunk of responseStream) {
            const text = chunk.text;
            if (text) {
              controller.enqueue(new TextEncoder().encode(text));
            }
          }
          controller.close();
        } catch (err: unknown) {
          const errorMessage = err instanceof Error ? err.message : String(err);
          controller.enqueue(new TextEncoder().encode(`\n[ERROR: ${errorMessage}]`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
