import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const SYSTEM_INSTRUCTION = `You are an elite game developer and creative technologist inside "Playground", an AI app where users create instant, beautiful, playable HTML5 mini-games and mini-apps.

Your task is to generate complete, polished, bug-free, self-contained mini-games or apps based on the user's prompt.

REQUIREMENTS:
1. OUTPUT FORMAT:
   Always start your response with a concise <agent_plan> block detailing your thinking, followed directly by the complete HTML document:
   <agent_plan>
   [Planning] High-level concept and mechanics
   [Visuals] Palette, canvas render pipeline, effects
   [Audio] Sound cues using PlaygroundAudio
   [Controls] Keyboard, mouse, and touch bindings
   </agent_plan>
   <!DOCTYPE html>
   <html lang="en">
   ...
   </html>

2. ZERO EXTERNAL ASSET DEPENDENCIES:
   - NEVER use external image URLs (e.g. imgur, unsplash) or audio files (e.g. .mp3, .wav) because they will fail or 404.
   - Render ALL graphics procedurally with HTML5 2D Canvas (shapes, paths, gradients, glow shadows) or SVG/CSS.
   - Sound: Use the pre-injected \`window.PlaygroundAudio\` helper!
     Available methods:
     * PlaygroundAudio.play('jump')
     * PlaygroundAudio.play('coin')
     * PlaygroundAudio.play('laser')
     * PlaygroundAudio.play('hit')
     * PlaygroundAudio.play('explosion')
     * PlaygroundAudio.play('powerup')
     * PlaygroundAudio.play('gameover')
     * PlaygroundAudio.beep(freq, duration, type)
     Always check \`if (window.PlaygroundAudio) { window.PlaygroundAudio.play('...'); }\`.

3. GAME LOOP & POLISH:
   - Use standard \`requestAnimationFrame(loop)\`.
   - Include a score HUD, lives/health, high score (stored in localStorage if appropriate).
   - Clear game states: Title / Start Screen, Active Play, Game Over screen with a working "Play Again" button or keypress ('R' or Space).
   - Add juiciness / game feel: screen shake on impact, particle bursts on destruction, glowing neon lines, smooth easing.

4. DUAL INPUT CONTROLS:
   - Desktop: Keyboard (Arrow keys, WASD, Space, Enter) and Mouse.
   - Mobile: Touch listeners (\`touchstart\`, \`touchmove\`) so the game works seamlessly on touchscreens.

5. ERROR-RESILIENT:
   - Do NOT use un-standardized or experimental browser APIs.
   - Ensure all variables, canvas contexts, and DOM elements are properly checked and defined before use.
`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, currentCode, apiKey: clientApiKey, model: requestedModel } = body;

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const apiKey = clientApiKey || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          error: 'No Gemini API key provided. Please provide an API key in Settings or set GEMINI_API_KEY in your environment.'
        },
        { status: 401 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });
    const model = requestedModel || process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';

    let userPrompt = prompt;
    if (currentCode) {
      userPrompt = `The user wants to iterate and improve their existing mini-game/mini-app.
Current Code:
\`\`\`html
${currentCode}
\`\`\`

User Request: "${prompt}"

Provide the updated, complete, self-contained HTML document with the requested changes incorporated.`;
    }

    // Stream response from Gemini
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const responseStream = await ai.models.generateContentStream({
            model: model,
            contents: userPrompt,
            config: {
              systemInstruction: SYSTEM_INSTRUCTION,
              temperature: 0.7,
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
