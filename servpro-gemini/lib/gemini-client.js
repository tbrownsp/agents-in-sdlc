// lib/gemini-client.js
// Gemini API wrapper — supports both Google AI Studio (GEMINI_API_KEY)
// and Vertex AI enterprise mode (GEMINI_ENTERPRISE=true).

import { GoogleGenerativeAI } from '@google/generative-ai';

// ─── Model aliases ────────────────────────────────────────────────────────────
export const MODEL_FAST = process.env.GEMINI_MODEL_FAST || 'gemini-2.0-flash';
export const MODEL_PRO  = process.env.GEMINI_MODEL_PRO  || 'gemini-2.5-pro';

const ENTERPRISE = process.env.GEMINI_ENTERPRISE === 'true';

// ─── System prompt shared across all SERVPRO workflows ───────────────────────
const SYSTEM_PROMPT = `
You are the senior restoration project manager for SERVPRO Bartlett/Cordova,
working directly for Tristan Brown. You manage reconstruction, mitigation,
contents, insurance, AR, Gmail, Drive, Calendar, CRM notes, customer communication,
field work orders, supplement reviews, and full job closeout.

ABSOLUTE RULES:
- Write in first-person PM voice ("I followed up", "Customer advised").
  Never use reviewer language ("needs updated status note", "review status").
- Never say Pending Sale money is overdue.
- Every CRM note must answer: Current Status | Recent Action | Blocker | Next Action | Follow-up date.
- All outputs are DRAFTS. Nothing is sent or posted until Tristan explicitly approves.
- Be direct, professional, accountable, and calm — never robotic or bureaucratic.
`.trim();

// ─── Google AI Studio client ──────────────────────────────────────────────────
let genAIClient = null;

function getAIStudioClient() {
  if (!genAIClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error(
        'GEMINI_API_KEY is not set. Add it to your .env file or environment.'
      );
    }
    genAIClient = new GoogleGenerativeAI(apiKey);
  }
  return genAIClient;
}

// ─── Vertex AI REST helper (enterprise mode) ─────────────────────────────────
async function vertexGenerate(modelId, prompt) {
  const project  = process.env.GOOGLE_CLOUD_PROJECT;
  const location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';
  if (!project) {
    throw new Error('GOOGLE_CLOUD_PROJECT is required for Vertex AI mode.');
  }

  // Obtain an access token via the metadata server (Cloud Run / GCE)
  // or via Application Default Credentials (local dev via gcloud auth).
  const { GoogleAuth } = await import('googleapis').then(m => m.default || m);
  const auth  = new GoogleAuth({ scopes: ['https://www.googleapis.com/auth/cloud-platform'] });
  const token = await auth.getAccessToken();

  const endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${project}` +
                   `/locations/${location}/publishers/google/models/${modelId}:generateContent`;

  const body = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
    generationConfig: { temperature: 0.3, maxOutputTokens: 4096 },
  };

  const { default: fetch } = await import('node-fetch');
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Vertex AI error ${response.status}: ${err}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

// ─── AI Studio REST helper ────────────────────────────────────────────────────
async function aiStudioGenerate(modelId, prompt) {
  const client = getAIStudioClient();
  const model  = client.getGenerativeModel({
    model: modelId,
    systemInstruction: SYSTEM_PROMPT,
    generationConfig: { temperature: 0.3, maxOutputTokens: 4096 },
  });
  const result = await model.generateContent(prompt);
  return result.response.text();
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Call Gemini with `prompt` using the fast model (gemini-2.0-flash).
 * Routes to Vertex AI if GEMINI_ENTERPRISE=true, otherwise Google AI Studio.
 *
 * @param {string} prompt
 * @returns {Promise<string>} The generated text.
 */
export async function generateFast(prompt) {
  return ENTERPRISE
    ? vertexGenerate(MODEL_FAST, prompt)
    : aiStudioGenerate(MODEL_FAST, prompt);
}

/**
 * Call Gemini with `prompt` using the pro model (gemini-2.5-pro).
 * Use for supplement letters, complex analysis, and high-stakes drafts.
 *
 * @param {string} prompt
 * @returns {Promise<string>} The generated text.
 */
export async function generatePro(prompt) {
  return ENTERPRISE
    ? vertexGenerate(MODEL_PRO, prompt)
    : aiStudioGenerate(MODEL_PRO, prompt);
}

/**
 * Run a tone and completeness quality check on a draft via Gemini.
 * Returns a pass/fail assessment and the (possibly corrected) draft.
 *
 * @param {string} draft - The draft text to check.
 * @returns {Promise<{passed: boolean, draft: string, issues: string[]}>}
 */
export async function qualityCheck(draft) {
  const prompt = `
Review the following SERVPRO CRM note or communication draft against these quality rules:
1. Written in first-person PM voice — not reviewer language.
2. Does NOT say Pending Sale money is overdue.
3. Contains a Next Action and a Follow-up date or trigger.
4. Contains no unresolved [PLACEHOLDER] tokens.
5. Tone is professional and calm — no frustration or informal language.

If any rule fails, rewrite only the failing section to fix it and list the issues found.
If all rules pass, respond with "PASS" on the first line then the original draft.

DRAFT:
${draft}
`.trim();

  const raw    = await generateFast(prompt);
  const passed = raw.startsWith('PASS');
  const lines  = raw.split('\n');
  const issues = passed ? [] : lines.filter(l => /^\d+\./.test(l));
  const text   = passed ? lines.slice(1).join('\n').trim() : raw;
  return { passed, draft: text, issues };
}
