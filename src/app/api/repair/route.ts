import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const REPAIR_SYSTEM_INSTRUCTION = `You are an automated self-healing debugger in Playground.
A generated HTML5 game crashed during runtime execution or has a syntax error.

Your job is to diagnose the error and return the corrected, complete, working HTML document.

RULES:
1. Output ONLY the complete, corrected, working HTML document starting with <!DOCTYPE html>.
2. Do NOT output conversational preambles, greetings, or explanations before or after the code.
3. Fix the specific crash while preserving all existing visuals, gameplay, controls, and sound effects.
4. Ensure all variables, canvas elements, and handlers are properly defined before use.
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
    const model = requestedModel || process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';

    console.log(`[API/REPAIR] Starting auto-repair with model "${model}" for error: "${error.message}" at line ${error.lineno || 'unknown'}`);

    const repairPrompt = `The following HTML5 game crashed with a runtime error.
Error: "${error.message}"
Line: ${error.lineno || 'unknown'}
Column: ${error.colno || 'unknown'}
Stack trace:
${error.stack || 'None'}

Game Concept: "${prompt || 'Interactive HTML5 game'}"

Broken HTML Code:
\`\`\`html
${code}
\`\`\`

Fix the error and output ONLY the complete, working HTML document:`;

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const responseStream = await ai.models.generateContentStream({
            model: model,
            contents: repairPrompt,
            config: {
              systemInstruction: REPAIR_SYSTEM_INSTRUCTION,
              temperature: 0.2, // Lower temperature for fast precision
            },
          });

          for await (const chunk of responseStream) {
            const text = chunk.text;
            if (text) {
              controller.enqueue(new TextEncoder().encode(text));
            }
          }
          controller.close();
          console.log('[API/REPAIR] Stream completed successfully.');
        } catch (err: unknown) {
          const errorMessage = err instanceof Error ? err.message : String(err);
          console.error('[API/REPAIR] Generation stream error:', errorMessage);
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
    console.error('[API/REPAIR] Request handler error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
