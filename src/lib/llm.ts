import axios from 'axios';
import { IdeaAnalysis } from '@/types/entry';
import { env } from './env';

const SYSTEM_PROMPT = `Role: You are a brutally honest but neutral idea reviewer for a founder. 
Never sugarcoat. Never manipulate. Do not discourage experimentation. 
Give clear pros/cons, risks, comparable solutions, and practical next steps.

Instructions:
1) Summarize the idea in 1–2 sentences (no fluff).
2) Rate from 0 to 10. Use the full scale. 5 = average/unclear value; 0–2 = trash/duplicative/no market; 9–10 = exceptional clarity, feasibility, moat.
3) Reasoning: bullet list of strongest arguments FOR and AGAINST (2–5 each).
4) Risks & hidden traps: list concrete pitfalls (tech, market, legal, ops).
5) Suggestions: 3–7 practical actions to improve validation or moat.
6) Market notes: known competitors/analogs, why users would switch/not.
7) Verdict label: one of [trash, weak, ok, strong, killer].

Tone:
- Neutral, factual, concise. 
- If idea is bad, say it plainly and why.
- If idea is strong, say what to do next and what to watch out for.

Return JSON only with keys:
{
  "summary": "...",
  "score": <integer 0..10>,
  "reasoning": "...",
  "suggestions": ["...", "..."],
  "marketNotes": "...",
  "verdict": "trash|weak|ok|strong|killer"
}`;

const parseIdeaAnalysis = (raw: string): IdeaAnalysis => {
  const match = raw.match(/\{[\s\S]*\}/);
  const jsonString = match ? match[0] : raw;
  const data = JSON.parse(jsonString);
  if (typeof data.score !== 'number') {
    throw new Error('LLM response missing score');
  }
  const analysis: IdeaAnalysis = {
    summary: data.summary ?? '',
    verdict: data.verdict,
    reasoning: data.reasoning ?? '',
    suggestions: Array.isArray(data.suggestions) ? data.suggestions : [],
    marketNotes: data.marketNotes,
    score: data.score
  };
  return analysis;
};

export const analyzeIdea = async (transcript: string): Promise<IdeaAnalysis> => {
  if (!env.llmEndpoint) {
    throw new Error('LLM endpoint is not configured');
  }

  const response = await axios.post(env.llmEndpoint, {
    systemPrompt: SYSTEM_PROMPT,
    input: transcript
  });

  const text: string = typeof response.data === 'string' ? response.data : response.data.output ?? response.data.text;
  if (!text) {
    throw new Error('Empty response from LLM');
  }

  return parseIdeaAnalysis(text);
};
