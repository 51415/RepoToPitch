// Ollama API client
// Talks to Ollama at http://localhost:11434 (proxied via /ollama in dev, direct in prod)

const getBase = () => {
  const stored = localStorage.getItem('ollama_host')
  const base = stored || '/ollama'
  return base.replace(/\/$/, '')
}

export async function listModels() {
  try {
    const res = await fetch(`${getBase()}/api/tags`)
    if (!res.ok) throw new Error(`Ollama returned ${res.status}`)
    const data = await res.json()
    return data.models || []
  } catch (e) {
    throw new Error(`Cannot reach Ollama at ${getBase()}. Is it running? (ollama serve)`)
  }
}

export async function streamChat({ model, system, prompt, onChunk, onDone }) {
  const chatBody = {
    model,
    messages: [
      ...(system ? [{ role: 'system', content: system }] : []),
      { role: 'user', content: prompt }
    ],
    stream: true,
    options: { temperature: 0.4, num_predict: 4096 }
  }

  let res
  try {
    res = await fetch(`${getBase()}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(chatBody)
    })

    // FALLBACK: If /api/chat is 404, try /api/generate (older Ollama or clones)
    if (res.status === 404) {
      console.warn('[OLLAMA_FALLBACK] /api/chat 404, trying /api/generate...')
      const genBody = {
        model,
        prompt,
        system,
        stream: true,
        options: { temperature: 0.4, num_predict: 4096 }
      }
      res = await fetch(`${getBase()}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(genBody)
      })
    }
  } catch (e) {
    throw new Error(`Cannot reach Ollama. Make sure it's running: ollama serve`)
  }

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Ollama error ${res.status}: ${text}`)
  }

  const reader = res.body.getReader()
  const dec = new TextDecoder()
  let full = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    const chunk = dec.decode(value, { stream: true })
    const lines = chunk.split('\n').filter(Boolean)
    for (const line of lines) {
      try {
        const json = JSON.parse(line)
        // Handle both /api/chat (message.content) and /api/generate (response)
        const content = json.message?.content || json.response
        if (content) {
          full += content
          // Sanitize common AI artifacts like LaTeX arrows
          const clean = full
            .replace(/\$ightarrow\$/g, '→')
            .replace(/\\rightarrow/g, '→')
            .replace(/\$leftarrow\$/g, '←')
            .replace(/\\leftarrow/g, '←')
            .replace(/\$bullet\$/g, '•')
          onChunk?.(clean)
        }
        if (json.done) {
          const finalClean = full
            .replace(/\$ightarrow\$/g, '→')
            .replace(/\\rightarrow/g, '→')
            .replace(/\$leftarrow\$/g, '←')
            .replace(/\\leftarrow/g, '←')
            .replace(/\$bullet\$/g, '•')
          onDone?.(finalClean)
        }
      } catch (e) {
        console.error('[OLLAMA_JSON_PARSE_ERROR]', e)
      }
    }
  }
  return full
}

export function setOllamaHost(host) {
  localStorage.setItem('ollama_host', host)
}

export function getOllamaHost() {
  return localStorage.getItem('ollama_host') || 'http://localhost:11434'
}
