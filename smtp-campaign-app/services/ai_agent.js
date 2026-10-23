/**
 * Novotion Email Automation — Universal Multi-Provider AI Agent Service
 * Supports Google Gemini, OpenAI, Anthropic Claude, Groq, and Custom/OpenRouter/Ollama endpoints.
 */

// Helper to call Google Gemini API
async function callGemini(apiKey, prompt, systemInstruction, model = 'gemini-2.5-flash') {
  const chosenModel = model || 'gemini-2.5-flash';
  try {
    const { GoogleGenAI } = require('@google/genai');
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: chosenModel,
      contents: prompt,
      config: {
        systemInstruction: systemInstruction || undefined,
        temperature: 0.7,
      },
    });
    return response.text;
  } catch (sdkErr) {
    // Direct Gemini REST API Fallback
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${chosenModel}:generateContent?key=${apiKey}`;
    const payload = {
      contents: [{ parts: [{ text: (systemInstruction ? `[SYSTEM INSTRUCTION]: ${systemInstruction}\n\n` : '') + prompt }] }],
      generationConfig: { temperature: 0.7 },
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Gemini API Error (${res.status}): ${errorText}`);
    }

    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }
}

// Helper to call OpenAI or OpenAI-compatible endpoint (OpenRouter, Ollama, Custom)
async function callOpenAICompatible(apiKey, prompt, systemInstruction, model = 'gpt-4o-mini', baseUrl = 'https://api.openai.com/v1') {
  const cleanBaseUrl = (baseUrl || 'https://api.openai.com/v1').replace(/\/+$/, '');
  const url = `${cleanBaseUrl}/chat/completions`;
  const messages = [];
  if (systemInstruction) {
    messages.push({ role: 'system', content: systemInstruction });
  }
  messages.push({ role: 'user', content: prompt });

  const headers = {
    'Content-Type': 'application/json',
  };
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: model || 'gpt-4o-mini',
      messages,
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`AI API Error (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

// Helper to call Anthropic Claude API
async function callClaude(apiKey, prompt, systemInstruction, model = 'claude-3-7-sonnet-20250219') {
  const url = 'https://api.anthropic.com/v1/messages';
  const messages = [{ role: 'user', content: prompt }];

  const payload = {
    model: model || 'claude-3-7-sonnet-20250219',
    max_tokens: 1500,
    messages,
    temperature: 0.7,
  };
  if (systemInstruction) {
    payload.system = systemInstruction;
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Anthropic Claude Error (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  return data.content?.[0]?.text || '';
}

// Helper to call Groq API
async function callGroq(apiKey, prompt, systemInstruction, model = 'llama-3.3-70b-versatile') {
  return callOpenAICompatible(apiKey, prompt, systemInstruction, model || 'llama-3.3-70b-versatile', 'https://api.groq.com/openai/v1');
}

/**
 * Test user's API Key against any chosen provider and model
 */
async function testAiKey({ provider, apiKey, model, baseUrl }) {
  if (!apiKey && provider !== 'custom') {
    throw new Error('API Key is required.');
  }

  const testPrompt = 'Respond with exact word "OK" to verify this connection.';
  let responseText = '';

  if (provider === 'gemini') {
    responseText = await callGemini(apiKey.trim(), testPrompt, '', model || 'gemini-2.5-flash');
  } else if (provider === 'openai') {
    responseText = await callOpenAICompatible(apiKey.trim(), testPrompt, '', model || 'gpt-4o-mini');
  } else if (provider === 'claude') {
    responseText = await callClaude(apiKey.trim(), testPrompt, '', model || 'claude-3-7-sonnet-20250219');
  } else if (provider === 'groq') {
    responseText = await callGroq(apiKey.trim(), testPrompt, '', model || 'llama-3.3-70b-versatile');
  } else if (provider === 'custom') {
    responseText = await callOpenAICompatible(apiKey ? apiKey.trim() : '', testPrompt, '', model || 'default', baseUrl || 'http://localhost:11434/v1');
  } else {
    throw new Error(`Unsupported AI provider: ${provider}`);
  }

  return {
    success: true,
    provider,
    model: model || 'default',
    message: `${provider.toUpperCase()} (${model || 'default'}) connection verified successfully!`,
    sampleResponse: responseText.trim().slice(0, 50),
  };
}

/**
 * Dispatch task to specialized Novotion AI Agent with any chosen model
 */
async function generateWithAgent({
  provider = 'gemini',
  apiKey,
  model,
  baseUrl,
  agentType = 'outreach',
  prompt = '',
  currentDraft = '',
  tone = 'executive',
  audienceContext = '',
}) {
  if (!apiKey && provider !== 'custom') {
    throw new Error('Please connect your AI account or enter your API key in the AI Assistant settings.');
  }

  let systemInstruction = '';
  let fullPrompt = '';

  switch (agentType) {
    case 'outreach':
      systemInstruction = `You are the Novotion Senior Cold Outreach AI Agent.
Your job is to craft hyper-personalized, high-converting B2B cold outreach emails.
RULES:
1. You MUST use dynamic merge tags: {{first_name}} for the recipient's first name, {{company}} for their organization, and {{position}} for their title.
2. Keep the email concise (80 - 130 words).
3. Provide a clear hook, concrete value proposition, and a soft, low-friction Call to Action (e.g. "Open to a brief 5-min intro?").
4. Output MUST be valid JSON with two fields: "subject" and "body".
JSON format:
{"subject": "...", "body": "..."}`;
      fullPrompt = `Audience Context: ${audienceContext || 'B2B Executives / Decision Makers'}
User Pitch Goal: ${prompt || 'Introduce our automated workflow solutions to help streamline operations and drive revenue.'}
Please generate a high-performing cold outreach email.`;
      break;

    case 'subject_optimizer':
      systemInstruction = `You are the Novotion Email Subject Line Specialist.
Your job is to generate 5 distinct, high-open-rate subject lines for email outreach.
RULES:
1. Use personalization tags like {{first_name}} or {{company}} in at least 3 variations.
2. Formats: 
   - Direct/Relevant
   - Curiosity/Intrigue
   - Question-based
   - Casual/Executive
   - Short & Punchy (under 6 words)
3. Output MUST be a JSON object with a "subjects" array of strings.
Example: {"subjects": ["Quick question for {{first_name}}", "{{company}} + Novotion idea", "Thought on {{position}} workflows at {{company}}"]}`;
      fullPrompt = `Email Goal/Content: ${prompt || currentDraft || 'Cold outreach to healthcare and tech leaders'}
Audience: ${audienceContext || 'Senior Executives'}
Generate 5 high-converting subject lines.`;
      break;

    case 'follow_up':
      systemInstruction = `You are the Novotion Follow-Up Sequence Architect.
Create a 3-step automated follow-up email sequence that boosts reply rates without being annoying.
Step 1: Day 3 Gentle Nudge (polite, quick check-in)
Step 2: Day 7 Value-Add (sharing an insight or relevant case study metric)
Step 3: Day 14 Clean Breakup (leaving the door open gracefully)
RULES:
1. Use merge tags: {{first_name}}, {{company}}.
2. Output MUST be a JSON object: {"steps": [{"step": 1, "timing": "Day 3", "subject": "...", "body": "..."}, ...]}`;
      fullPrompt = `Original Offer/Context: ${prompt || currentDraft || 'Automating outreach and lead engagement for organizations'}
Generate the 3-step follow-up sequence.`;
      break;

    case 'tone_rewrite':
      systemInstruction = `You are the Novotion Email Copywriting Specialist.
Your task is to rewrite the provided email draft to match the requested tone: "${tone}".
Tone styles:
- executive: Ultra-concise, direct, respectful of time, no fluff.
- consultative: Helpful, advisory, focused on solving operational problems.
- friendly: Warm, conversational, approachable.
- persuasive: Benefit-heavy, dynamic, urgent.
RULES:
1. Keep all existing merge tags like {{first_name}}, {{company}}, {{position}}.
2. Output MUST be a JSON object: {"subject": "...", "body": "..."}`;
      fullPrompt = `Draft to rewrite:
Subject: ${prompt || 'Partnership inquiry'}
Body:
${currentDraft || prompt}

Please rewrite this draft with a ${tone} tone.`;
      break;

    default:
      systemInstruction = `You are the Novotion Email Automation AI Copilot. Assist the user with their email marketing, copywriting, and strategy tasks.`;
      fullPrompt = prompt;
  }

  // Call the selected provider
  let rawResponse = '';
  if (provider === 'gemini') {
    rawResponse = await callGemini(apiKey ? apiKey.trim() : '', fullPrompt, systemInstruction, model);
  } else if (provider === 'openai') {
    rawResponse = await callOpenAICompatible(apiKey ? apiKey.trim() : '', fullPrompt, systemInstruction, model);
  } else if (provider === 'claude') {
    rawResponse = await callClaude(apiKey ? apiKey.trim() : '', fullPrompt, systemInstruction, model);
  } else if (provider === 'groq') {
    rawResponse = await callGroq(apiKey ? apiKey.trim() : '', fullPrompt, systemInstruction, model);
  } else if (provider === 'custom') {
    rawResponse = await callOpenAICompatible(apiKey ? apiKey.trim() : '', fullPrompt, systemInstruction, model, baseUrl);
  }

  // Attempt to parse JSON output
  let parsed = null;
  try {
    const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      parsed = JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    // fallback if not valid json
  }

  return {
    success: true,
    agentType,
    provider,
    model: model || 'default',
    result: parsed || { text: rawResponse },
    raw: rawResponse,
  };
}

module.exports = {
  testAiKey,
  generateWithAgent,
};
