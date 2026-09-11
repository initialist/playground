import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { GoogleGenAI } from '@google/genai';

// Load .env.local if present
const envLocalPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
  const envContent = fs.readFileSync(envLocalPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

const PORT = parseInt(process.env.PORT || '3001', 10);
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'playground-super-secret-production-and-dev-key-2026'
);
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';

const prisma = new PrismaClient();
const app = express();

// CORS setup: allow localhost and any github.io domain, plus configurable CORS_ORIGIN
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl)
      if (!origin) return callback(null, true);
      if (
        origin.includes('localhost') ||
        origin.includes('127.0.0.1') ||
        origin.endsWith('.github.io') ||
        origin.endsWith('.pages.dev') ||
        (process.env.CORS_ORIGIN && origin === process.env.CORS_ORIGIN)
      ) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive for public API / static frontend access
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json({ limit: '10mb' }));

// Auth Helpers & Middleware
interface AuthUser {
  userId: string;
  username: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser | null;
    }
  }
}

async function verifyToken(token: string): Promise<AuthUser | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (payload.userId && payload.username) {
      return { userId: String(payload.userId), username: String(payload.username) };
    }
    return null;
  } catch {
    return null;
  }
}

async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    req.user = await verifyToken(token);
  } else {
    req.user = null;
  }
  next();
}

app.use(authMiddleware);

// Health check
app.get(['/health', '/api/health'], (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ==========================================
// AUTH ROUTES
// ==========================================

app.post('/api/auth/signup', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;

    if (!username || typeof username !== 'string' || username.trim().length < 3) {
      res.status(400).json({ error: 'Username must be at least 3 characters.' });
      return;
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters.' });
      return;
    }

    const cleanUsername = username.trim().toLowerCase();
    if (!/^[a-zA-Z0-9_-]+$/.test(cleanUsername)) {
      res.status(400).json({ error: 'Username can only contain letters, numbers, hyphens, and underscores.' });
      return;
    }

    const existing = await prisma.user.findUnique({ where: { username: cleanUsername } });
    if (existing) {
      res.status(409).json({ error: 'Username is already taken.' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { username: cleanUsername, passwordHash },
      select: { id: true, username: true, createdAt: true },
    });

    const token = await new SignJWT({ userId: user.id, username: user.username })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('30d')
      .sign(JWT_SECRET);

    res.json({ user, token });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Signup failed.' });
  }
});

app.post('/api/auth/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      res.status(400).json({ error: 'Username and password are required.' });
      return;
    }

    const cleanUsername = username.trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { username: cleanUsername } });
    if (!user) {
      res.status(401).json({ error: 'Invalid username or password.' });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: 'Invalid username or password.' });
      return;
    }

    const token = await new SignJWT({ userId: user.id, username: user.username })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('30d')
      .sign(JWT_SECRET);

    res.json({
      user: {
        id: user.id,
        username: user.username,
        avatar: user.avatar,
        createdAt: user.createdAt,
      },
      token,
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed.' });
  }
});

app.get('/api/auth/me', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.json({ user: null });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, username: true, avatar: true, createdAt: true },
    });

    res.json({ user: user || null });
  } catch (err) {
    console.error('Auth check error:', err);
    res.json({ user: null });
  }
});

// ==========================================
// APPS CRUD & REMIX ROUTES
// ==========================================

app.get('/api/apps', async (req: Request, res: Response): Promise<void> => {
  try {
    const category = req.query.category as string | undefined;
    const search = req.query.search as string | undefined;
    const sort = (req.query.sort as string) || 'trending';
    const limit = Math.min(Math.max(parseInt((req.query.limit as string) || '30', 10), 1), 100);

    const where: Record<string, unknown> = { isPublic: true };
    if (category && category !== 'all') {
      where.category = category;
    }
    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { title: { contains: q } },
        { description: { contains: q } },
        { tags: { contains: q } },
      ];
    }

    let orderBy: Record<string, 'asc' | 'desc'> = { createdAt: 'desc' };
    if (sort === 'popular') {
      orderBy = { views: 'desc' };
    } else if (sort === 'trending') {
      orderBy = { forks: 'desc' };
    }

    const apps = await prisma.app.findMany({
      where,
      orderBy,
      take: limit,
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        tags: true,
        views: true,
        likes: true,
        forks: true,
        authorName: true,
        authorId: true,
        createdAt: true,
        updatedAt: true,
        author: {
          select: { id: true, username: true, avatar: true },
        },
      },
    });

    res.json({ apps });
  } catch (err) {
    console.error('Failed to fetch apps:', err);
    res.status(500).json({ error: 'Failed to fetch apps.' });
  }
});

app.post('/api/apps', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      id,
      title,
      description,
      code,
      instructions,
      category = 'tools',
      tags,
      isPublic = true,
      lastPrompt,
      agentPlan,
    } = req.body;

    if (!code || typeof code !== 'string') {
      res.status(400).json({ error: 'App code is required.' });
      return;
    }

    const appTitle = (title || 'Untitled Mini-App').trim();
    const authorName = req.user?.username || 'Anonymous Creator';
    const authorId = req.user?.userId || null;

    let app;
    if (id) {
      const existing = await prisma.app.findUnique({ where: { id } });
      if (existing) {
        if (existing.authorId && existing.authorId !== req.user?.userId) {
          res.status(403).json({ error: "You cannot edit someone else's app. Use Remix instead!" });
          return;
        }

        app = await prisma.app.update({
          where: { id },
          data: {
            title: appTitle,
            description,
            code,
            instructions,
            category,
            tags,
            isPublic,
          },
        });
      }
    }

    if (!app) {
      app = await prisma.app.create({
        data: {
          title: appTitle,
          description,
          code,
          instructions,
          category,
          tags,
          isPublic,
          authorName,
          authorId,
        },
      });
    }

    if (lastPrompt) {
      await prisma.agentHistory.create({
        data: {
          appId: app.id,
          prompt: lastPrompt,
          agentPlan: agentPlan || null,
          verificationStatus: 'passed',
        },
      });
    }

    res.json({ app });
  } catch (err) {
    console.error('Failed to save app:', err);
    res.status(500).json({ error: 'Failed to save app.' });
  }
});

app.get('/api/apps/my', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized.' });
      return;
    }

    const apps = await prisma.app.findMany({
      where: { authorId: req.user.userId },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        isPublic: true,
        views: true,
        likes: true,
        forks: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({ apps });
  } catch (err) {
    console.error('Failed to fetch user apps:', err);
    res.status(500).json({ error: 'Failed to fetch apps.' });
  }
});

app.get('/api/apps/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const app = await prisma.app.update({
      where: { id },
      data: { views: { increment: 1 } },
      include: {
        author: { select: { id: true, username: true, avatar: true } },
        agentHistories: {
          orderBy: { timestamp: 'asc' },
          select: { id: true, prompt: true, agentPlan: true, verificationStatus: true, timestamp: true },
        },
      },
    });

    res.json({ app });
  } catch (err) {
    console.error('Failed to get app:', err);
    res.status(404).json({ error: 'App not found.' });
  }
});

app.post('/api/apps/:id/fork', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const original = await prisma.app.findUnique({
      where: { id },
      include: { agentHistories: { orderBy: { timestamp: 'asc' } } },
    });

    if (!original) {
      res.status(404).json({ error: 'App not found.' });
      return;
    }

    await prisma.app.update({
      where: { id },
      data: { forks: { increment: 1 } },
    });

    const remixedTitle = `${original.title} (Remix)`;
    const newApp = await prisma.app.create({
      data: {
        title: remixedTitle,
        description: `Remix of ${original.title}. ${original.description || ''}`.trim(),
        code: original.code,
        instructions: original.instructions,
        category: original.category,
        tags: original.tags,
        isPublic: false,
        forkedFromId: original.id,
        authorId: req.user?.userId || null,
        authorName: req.user?.username || 'Anonymous Remixer',
      },
    });

    if (original.agentHistories && original.agentHistories.length > 0) {
      await prisma.agentHistory.createMany({
        data: original.agentHistories.map((h: { prompt: string; agentPlan: string | null; verificationStatus: string | null }) => ({
          appId: newApp.id,
          prompt: h.prompt,
          agentPlan: h.agentPlan,
          verificationStatus: h.verificationStatus,
        })),
      });
    }

    res.json({ app: newApp, message: 'App remixed successfully!' });
  } catch (err) {
    console.error('Failed to remix app:', err);
    res.status(500).json({ error: 'Failed to remix app.' });
  }
});

app.delete('/api/apps/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized.' });
      return;
    }

    const app = await prisma.app.findUnique({ where: { id } });
    if (!app) {
      res.status(404).json({ error: 'App not found.' });
      return;
    }
    if (app.authorId !== req.user.userId) {
      res.status(403).json({ error: 'Forbidden. Not your app.' });
      return;
    }

    await prisma.app.delete({ where: { id } });
    res.json({ success: true });
  } catch (err) {
    console.error('Failed to delete app:', err);
    res.status(500).json({ error: 'Failed to delete app.' });
  }
});

// ==========================================
// AI CODE GENERATION & STREAMING
// ==========================================

const SYSTEM_INSTRUCTION = `You are an elite developer and creative technologist inside "Playground", an AI app where users create instant, beautiful, playable HTML5 mini-apps and tools.

Your task is to generate complete, polished, bug-free, self-contained mini-apps based on the user's prompt.

REQUIREMENTS:
1. OUTPUT FORMAT:
   Always start your response with a concise <agent_plan> block detailing your thinking, followed directly by the complete HTML document:
   <agent_plan>
   [Planning] High-level concept and mechanics
   [Visuals] Palette, canvas/DOM render pipeline, clean UI
   [Audio] Sound cues using PlaygroundAudio
   [Controls] Keyboard, mouse, and touch bindings
   </agent_plan>
   <!DOCTYPE html>
   <html lang="en">
   ...
   </html>

2. ZERO EXTERNAL ASSET DEPENDENCIES:
   - NEVER use external image URLs or audio files because they will fail or 404.
   - Render ALL graphics procedurally with HTML5 2D Canvas or clean CSS.
   - Sound: Use the pre-injected window.PlaygroundAudio helper (play('jump'|'coin'|'laser'|'hit'|'powerup'|'gameover') or beep(freq, duration)).

3. POLISH & RESPONSIVENESS:
   - The app must fill 100% of the viewport and dynamically adapt to resize.
   - In CSS: html, body { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; }
`;

const REPAIR_SYSTEM_INSTRUCTION = `You are the automated self-healing diagnostic engine for "Playground".
Your job is to analyze the runtime exception, locate the defect in the existing HTML/JS/CSS code, and output the complete repaired HTML document.

Output format:
<agent_plan>
[Root Cause] Explain the bug
[Repair Strategy] How you fixed it
</agent_plan>
<!DOCTYPE html>
<html lang="en">
...
</html>
`;

app.post('/api/generate', async (req: Request, res: Response): Promise<void> => {
  try {
    const { prompt, currentCode } = req.body;
    if (!prompt || typeof prompt !== 'string') {
      res.status(400).json({ error: 'Prompt is required' });
      return;
    }

    if (!GEMINI_API_KEY) {
      res.status(401).json({ error: 'Server missing GEMINI_API_KEY environment variable.' });
      return;
    }

    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

    let userPrompt = prompt;
    if (currentCode) {
      userPrompt = `The user wants to iterate and improve their existing mini-app.
Current Code:
\`\`\`html
${currentCode}
\`\`\`

User Request: "${prompt}"

Provide the updated, complete, self-contained HTML document with the requested changes incorporated.`;
    }

    // Prepare chunked streaming
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('X-Accel-Buffering', 'no');

    const responseStream = await ai.models.generateContentStream({
      model: GEMINI_MODEL,
      contents: userPrompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
      },
    });

    for await (const chunk of responseStream) {
      const text = chunk.text;
      if (text) {
        res.write(text);
      }
    }

    res.end();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Generation failed';
    console.error('Generation error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: message });
    } else {
      res.write(`\n[ERROR: ${message}]`);
      res.end();
    }
  }
});

app.post('/api/repair', async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, error, prompt } = req.body;
    if (!code || !error) {
      res.status(400).json({ error: 'Code and error details are required' });
      return;
    }

    if (!GEMINI_API_KEY) {
      res.status(401).json({ error: 'Server missing GEMINI_API_KEY environment variable.' });
      return;
    }

    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    const repairPrompt = `An error occurred while running the following HTML5 mini-app:

Original Prompt: "${prompt || 'Interactive mini-app'}"
Error Message: "${error.message}"
Location: Line ${error.lineno || 'unknown'}, Column ${error.colno || 'unknown'}

Broken Code:
\`\`\`html
${code}
\`\`\`

Fix the bug and provide the complete corrected HTML document.`;

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('X-Accel-Buffering', 'no');

    const responseStream = await ai.models.generateContentStream({
      model: GEMINI_MODEL,
      contents: repairPrompt,
      config: {
        systemInstruction: REPAIR_SYSTEM_INSTRUCTION,
        temperature: 0.3,
      },
    });

    for await (const chunk of responseStream) {
      const text = chunk.text;
      if (text) {
        res.write(text);
      }
    }

    res.end();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Repair failed';
    console.error('Repair error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: message });
    } else {
      res.write(`\n[ERROR: ${message}]`);
      res.end();
    }
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`> Playground Backend Server running on http://0.0.0.0:${PORT}`);
  console.log(`> Model locked to: ${GEMINI_MODEL}`);
});
