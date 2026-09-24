// Emergent LLM (OpenAI-compatible) wrapper. Uses gpt-4o-mini for cheap+fast summarization.

const BASE = 'https://integrations.emergentagent.com/llm/openai/v1'
const KEY = process.env.EMERGENT_LLM_KEY
const MODEL = 'gpt-4o-mini'

export async function chatComplete({ system, user, maxTokens = 300, temperature = 0.4 }) {
  if (!KEY) return null
  try {
    const r = await fetch(`${BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: maxTokens,
        temperature,
        messages: [
          system ? { role: 'system', content: system } : null,
          { role: 'user', content: user },
        ].filter(Boolean),
      }),
    })
    if (!r.ok) {
      console.error('LLM error', r.status, await r.text().catch(() => ''))
      return null
    }
    const j = await r.json()
    return j.choices?.[0]?.message?.content?.trim() || null
  } catch (e) {
    console.error('LLM exception', e.message)
    return null
  }
}

// Given an article title + description, produce (1) a short editorial summary,
// (2) a channel guess, (3) importance 1-5. Returns JSON or null on failure.
export async function classifyAndSummarize(article) {
  const raw = await chatComplete({
    system: `Você é um editor-chefe brasileiro. Responda APENAS um JSON válido, nada mais.
Campos:
- summary: string em pt-BR, 2 frases curtas, tom editorial neutro, direto ao ponto, sem clickbait, 300-400 caracteres.
- channel: uma de ["politica","futebol","celebridades","mundo"].
- importance: inteiro 1 (rotineiro) a 5 (crítico).
- topics: array de 2-4 strings (times, pessoas, instituições, assuntos-chave).
- status: "agora" se factual e imediato, "importante" se alto impacto, "desenvolvimento" se em curso, "atualizacao" se rotineiro.`,
    user: `Título: ${article.title}\nFonte: ${article.sourceName}\nDescrição: ${article.description || '(sem descrição)'}`,
    maxTokens: 400,
  })
  if (!raw) return null
  try {
    const cleaned = raw.replace(/^```(?:json)?/i, '').replace(/```$/,'').trim()
    return JSON.parse(cleaned)
  } catch { return null }
}
