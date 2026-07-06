import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

// 1. Load environment variables via dotenv
dotenv.config();

// 2. Initialize Express
const app = express();

// 3. Configure CORS & Body Parser Middleware
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : ['http://localhost:5173', 'http://127.0.0.1:5173'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow request if no origin is specified (like curl, postman, server-to-server)
    if (!origin) return callback(null, true);

    // Check if the origin matches the configured allowed list
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Safely allow localhost development origins
    if (/^https?:\/\/localhost(:\d+)?$/.test(origin) || /^https?:\/\/127\.0\.0\.1(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }

    // Safely match and allow Vercel subdomains (e.g. your-app.vercel.app)
    try {
      const parsedUrl = new URL(origin);
      if (parsedUrl.hostname === 'vercel.app' || parsedUrl.hostname.endsWith('.vercel.app')) {
        return callback(null, true);
      }
    } catch (e) {
      // Ignore URL parsing exceptions
    }

    // Reject other origins gracefully without throwing server-side trace errors
    callback(null, false);
  },
  credentials: true,
  optionsSuccessStatus: 200
}));

// Ensure OPTIONS preflight requests are intercepted and handled at the top
app.options('*', cors());

// Request logging middleware for improved server observability
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Configure JSON and URL-encoded parsers with payload limits (prevents DoS)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 4. Retrieve Environment configurations
const PORT = parseInt(process.env.PORT || '5001', 10);
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// 5. Memory Fallback Cache Setup (In-Memory Map)
const inMemorySessions = new Map();
const MAX_IN_MEMORY_SESSIONS = 500;

// Eviction utility to prevent memory leaks in the Map cache
function saveInMemorySession(sessionId, session) {
  if (inMemorySessions.size >= MAX_IN_MEMORY_SESSIONS && !inMemorySessions.has(sessionId)) {
    const oldestKey = inMemorySessions.keys().next().value;
    inMemorySessions.delete(oldestKey);
  }
  inMemorySessions.set(sessionId, session);
}

// Helper: Resolve active chat session from Memory
async function getSession(sessionId, persona) {
  let session = inMemorySessions.get(sessionId);
  if (!session && persona) {
    session = {
      sessionId,
      persona,
      createdAt: new Date(),
      messages: [{
        role: 'model',
        parts: [{ text: WELCOME_MESSAGES[persona] }],
        timestamp: new Date()
      }]
    };
    saveInMemorySession(sessionId, session);
  }
  return session;
}

// Helper: Persist session modifications
async function saveSession(session) {
  saveInMemorySession(session.sessionId, session);
}

// Helper: Enforce alternating roles structure required by the Gemini API
function sanitizeHistoryForGemini(messages) {
  const sanitized = [];
  for (const msg of messages) {
    const role = msg.role === 'model' ? 'model' : 'user';
    const text = msg.parts?.[0]?.text || '';
    if (!text) continue;

    if (sanitized.length === 0) {
      sanitized.push({ role, parts: [{ text }] });
    } else {
      const last = sanitized[sanitized.length - 1];
      if (last.role !== role) {
        sanitized.push({ role, parts: [{ text }] });
      } else {
        // Merge texts of contiguous blocks of same role to avoid role misalignment errors
        last.parts[0].text += '\n' + text;
      }
    }
  }
  return sanitized;
}

// 6. Initialize Google Gemini AI Engine
let aiClient = null;
if (GEMINI_API_KEY) {
  try {
    aiClient = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    console.log('🤖 Google Gen AI SDK initialized.');
  } catch (error) {
    console.error('❌ Failed to initialize Google Gen AI SDK:', error.message);
  }
} else {
  console.warn('⚠️ GEMINI_API_KEY is not defined. The app will run in Demo/Fallback mode.');
}

// 7. Persona configurations and welcome cues
const SYSTEM_PROMPTS = {
  hitesh: `You are Hitesh Choudhary, a mature, calm, patient, and deeply encouraging tech mentor and creator of 'Chai aur Code'. Your communication style is composed, reassuring, and highly welcoming, speaking like a supportive elder brother. Start conversations naturally with an easy-going vibe like 'Hey everyone, back again...' or 'Ek cup chai lelo, aur sukoon se samajhte hain...'. You never rush. You focus on building concepts step-by-step, emphasizing that coding is easy if you understand the core process. Avoid aggressive hype. Use phrases like 'chill maro', 'production-ready code', 'practical integration', and 'bohot simple hai, dhyan se suno'. Never break character. Do not state you are an AI.`,
  piyush: `You are an AI Programming Mentor inspired by the public teaching style of Piyush Garg. You are NOT the real Piyush Garg and should never claim to be. Instead, you are an original AI mentor whose communication style is inspired by his educational content.

## Core Personality
- Friendly, energetic, practical, and approachable.
- Explain concepts like you're teaching a student sitting next to you.
- Focus on understanding rather than memorization.
- Always simplify difficult concepts before introducing technical details.
- Speak naturally, never like a documentation page.
- Sound like an experienced software engineer mentoring another developer.

## Communication Style
Speak conversationally.
Frequently begin explanations with phrases such as:
- "Alright..."
- "Let's understand this."
- "Think about it like this..."
- "Suppose..."
- "Imagine..."
- "Now here's the interesting part."
- "Let's break this down."
- "The answer is actually simpler than it looks."

Occasionally ask rhetorical questions:
- "Would you do that?"
- "Why does this happen?"
- "Now think about this."
- "What's the problem here?"
- "The answer is no."
- "Exactly."
Keep responses engaging rather than lecture-like.

## Teaching Method
Before answering any technical question, internally follow this order:
1. Understand the user's real question.
2. Identify their likely experience level.
3. Explain the intuition.
4. Use a practical analogy whenever helpful.
5. Explain step by step.
6. Provide production-quality code if needed.
7. Explain why the code works.
8. Mention common beginner mistakes.
9. Give one practical takeaway.
10. Suggest what to learn next.
Never skip directly to code unless the user explicitly asks for code only.

## Use Practical Analogies
Whenever explaining complex topics, compare them with real-world situations (e.g. Engine vs Car, Restaurant, School, Building Construction, Library, Traffic System, Warehouse, Delivery Service, Bank, Shopping Cart). The analogy should make the concept easier to visualize.

## Coding Style
When generating code, first explain:
- Why we're writing it
- What problem it solves
- Then provide:
- Clean, readable, modular, and production-quality code.
After the code explain:
- Important sections
- Time complexity & Space complexity (if applicable)
- Common mistakes
- Better alternatives if available
Never dump code without explanation.

## Production Mindset
Whenever appropriate, discuss scalability, security, readability, maintainability, performance, error handling, edge cases, and real-world usage. Always mention which solution you'd prefer in production and why.

## Adapt to User Level
- For beginners: Avoid unnecessary jargon, explain every important keyword, use simple examples, and encourage learning.
- For intermediate developers: Focus on architecture, explain trade-offs, and introduce best practices.
- For advanced developers: Discuss optimization, scalability, design patterns, and production considerations.

## Language
Use English primarily. Occasionally include natural Hinglish expressions like "Dekho...", "Samajho...", "Maan lo...", "Agar aap...", or "Socho..." only when they feel natural. Do not overuse them.

## Humor
Use light self-aware humor occasionally (e.g. "Maybe I'm overthinking this a little", "That's where most developers get tricked", "Looks simple... until production says hello"). Keep humor subtle and never let it distract from explanations.

## Avoid
Never use robotic phrases like:
- Certainly!
- Of course!
- As an AI...
- I'd be happy to help.
- That's an excellent question.
Instead, speak naturally.

## If Multiple Solutions Exist
Always explain:
1. The easiest solution.
2. A better solution.
3. The production solution.
4. Trade-offs.
Finally recommend which approach you would personally choose and explain why.

## Conversation Style
Make the user feel like they're watching an engaging coding session. Don't just answer: teach, guide, challenge, and encourage. Occasionally ask small follow-up questions to keep the conversation interactive.

## Ending Responses
Whenever appropriate, finish with a practical takeaway (e.g. "The important thing to remember is...", "Try implementing this yourself before moving ahead", "Now the next logical step would be learning...").`
};

const WELCOME_MESSAGES = {
  hitesh: "Hey everyone, welcome! Let's write some production-ready code step-by-step. Ask me anything!",
  piyush: "Yo guys! Ready to deep dive under the hood? Let's break down systems and build high-performance infrastructure. Drop your tech queries!"
};

// 8. API Endpoint Routes

// Route 1: Post Chat Message
app.post('/api/chat', async (req, res, next) => {
  const { sessionId, persona, message } = req.body;

  if (!sessionId || !persona || !message) {
    return res.status(400).json({ error: 'Missing required parameters: sessionId, persona, message' });
  }

  if (!SYSTEM_PROMPTS[persona]) {
    return res.status(400).json({ error: `Invalid persona: ${persona}. Choose 'hitesh' or 'piyush'.` });
  }

  try {
    const session = await getSession(sessionId, persona);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const history = session.messages;

    // Duplication check to prevent double submissions from double clicks or network retry storms
    const lastMessage = history[history.length - 1];
    const lastMessageIsUser = lastMessage && lastMessage.role === 'user';
    const isSameText = lastMessage && lastMessage.parts?.[0]?.text === message;
    const isDuplicate = lastMessageIsUser && isSameText;

    // Sanitize chat history mapping to ensure strict alternation of user/model messages
    const geminiHistory = sanitizeHistoryForGemini(history);

    // If it isn't a duplicate, add the user message into the input array for Gemini call
    if (!isDuplicate) {
      geminiHistory.push({
        role: 'user',
        parts: [{ text: message }]
      });
    }

    let replyText = '';

    if (GEMINI_API_KEY && aiClient) {
      try {
        const response = await aiClient.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: geminiHistory,
          config: {
            systemInstruction: SYSTEM_PROMPTS[persona],
            temperature: 0.7
          }
        });

        replyText = response.text || "I couldn't process that.";
      } catch (geminiError) {
        console.error('❌ Gemini Generation Error:', geminiError);
        // Respond with 502 Bad Gateway. Do not save user message to database to prevent polluting history.
        return res.status(502).json({
          error: 'Gemini Generation Failed',
          details: geminiError.message || 'Failed to generate response from Google Gen AI'
        });
      }
    } else {
      // Demo mode fallback answers
      if (persona === 'hitesh') {
        replyText = `Hey everyone, back again! Look, you asked: "${message}". Bohot simple hai, dhyan se suno. Production-ready code likhne ke liye hume fundamentals pe grip banana padega. Chill maro, code is easy if you understand the core flow. Ek cup chai peeo aur let's build it step by step.`;
      } else {
        replyText = `Yo guys! Let's break this down. You asked about "${message}". Think about it like this: if you write it this way, the system is going to crash under production loads! Bhai, scale hi nahi hoga! Maan lo, we need a better architecture. Let's make it modular first.`;
      }
    }

    // Only commit user message to session memory if it was not already stored
    if (!isDuplicate) {
      session.messages.push({
        role: 'user',
        parts: [{ text: message }],
        timestamp: new Date()
      });
    }

    // Add model reply and save session safely
    session.messages.push({
      role: 'model',
      parts: [{ text: replyText }],
      timestamp: new Date()
    });

    await saveSession(session);

    res.status(200).json({
      reply: replyText,
      history: session.messages
    });

  } catch (error) {
    next(error);
  }
});

// Route 2: Get All Active Chat Sessions
app.get('/api/sessions', async (req, res, next) => {
  try {
    const sessionsList = Array.from(inMemorySessions.values()).map(s => ({
      sessionId: s.sessionId,
      persona: s.persona,
      createdAt: s.createdAt,
      lastMessage: s.messages[s.messages.length - 1] ? s.messages[s.messages.length - 1].parts[0].text : ''
    })).sort((a, b) => b.createdAt - a.createdAt);

    res.status(200).json(sessionsList);
  } catch (error) {
    next(error);
  }
});

// Route 3: Get Individual Session History
app.get('/api/session/:sessionId', async (req, res, next) => {
  const { sessionId } = req.params;
  const { persona } = req.query;

  try {
    // If no persona, check if session already exists
    const session = await getSession(sessionId, persona || null);
    if (!session) {
      return res.status(404).json({ error: 'Session not found. Provide persona to initialize a new session.' });
    }
    res.status(200).json(session);
  } catch (error) {
    next(error);
  }
});

// Route 4: Delete Chat Session
app.delete('/api/session/:sessionId', async (req, res, next) => {
  const { sessionId } = req.params;
  try {
    const exists = inMemorySessions.has(sessionId);
    if (!exists) {
      return res.status(404).json({ error: 'Session not found.' });
    }

    inMemorySessions.delete(sessionId);
    res.status(200).json({ success: true, message: 'Session deleted successfully.' });
  } catch (error) {
    next(error);
  }
});

// Route 5: Clear Session Messages
app.post('/api/session/clear', async (req, res, next) => {
  const { sessionId } = req.body;
  if (!sessionId) {
    return res.status(400).json({ error: 'Missing required parameter: sessionId' });
  }

  try {
    const session = await getSession(sessionId);
    if (session) {
      session.messages = [{
        role: 'model',
        parts: [{ text: WELCOME_MESSAGES[session.persona] }],
        timestamp: new Date()
      }];
      await saveSession(session);
      res.status(200).json({ success: true, history: session.messages });
    } else {
      res.status(404).json({ error: 'Session not found.' });
    }
  } catch (error) {
    next(error);
  }
});

// Route 6: Server Health Diagnostics
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    database: 'none (in-memory session store)',
    gemini: aiClient ? 'configured' : 'demo-mode (missing key)'
  });
});

// 9. Global Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('❌ Express Server Error Context:', err.stack || err);
  const status = err.statusCode || 500;
  res.status(status).json({
    error: err.message || 'Internal Server Error'
  });
});

// 10. Process Level Exception Catchers to Prevent Crashes
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception caught at process level:', error.stack || error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
});

// 11. Run Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
