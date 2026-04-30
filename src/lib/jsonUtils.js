/**
 * Attempts to repair common JSON errors made by LLMs.
 */
export function repairJson(str) {
  let fixed = str.trim()

  // 1. Remove trailing commas before closing brackets/braces
  fixed = fixed.replace(/,\s*([\]}])/g, '$1')

  // 2. Fix missing quotes on keys (basic)
  fixed = fixed.replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":')

  // 3. Fix unescaped single quotes used as delimiters (risky but often needed)
  // fixed = fixed.replace(/'/g, '"') // Too dangerous if content has contractions

  return fixed
}

/**
 * High-resilience JSON extraction.
 * Extracts the first valid-looking JSON array or object from a string.
 */
export function extractJson(text) {
  const startBracket = text.indexOf('[')
  const startBrace = text.indexOf('{')
  
  let start = -1
  if (startBracket !== -1 && startBrace !== -1) {
    start = Math.min(startBracket, startBrace)
  } else {
    start = startBracket !== -1 ? startBracket : startBrace
  }

  if (start === -1) throw new Error('NO_JSON_START')
  let bracketCount = 0
  let end = -1
  const startChar = text[start]
  const endChar = startChar === '[' ? ']' : '}'

  for (let i = start; i < text.length; i++) {
    if (text[i] === startChar) bracketCount++
    else if (text[i] === endChar) bracketCount--

    if (bracketCount === 0) {
      end = i
      break
    }
  }

  if (end === -1) throw new Error('INCOMPLETE_JSON_STRUCTURE')
  const raw = text.substring(start, end + 1)
  
  // If the extracted content is obviously not JSON (like [X] or just brackets)
  if (raw.length < 5 && (raw.includes('X') || raw.includes('?'))) {
    throw new Error('INVALID_AI_RESPONSE_GARBAGE')
  }
  
  try {
    let data = JSON.parse(raw)
    // ONLY extract nested array if the root object doesn't look like a slide/outline already
    if (!Array.isArray(data) && typeof data === 'object') {
      const hasContent = data.title || data.slide || data.header || data.bullets
      if (!hasContent) {
        const firstArray = Object.values(data).find(v => Array.isArray(v))
        if (firstArray) data = firstArray
      }
    }
    return normalizeData(data)
  } catch (e) {
    try {
      let data = JSON.parse(repairJson(raw))
      if (!Array.isArray(data) && typeof data === 'object') {
        const hasContent = data.title || data.slide || data.header || data.bullets
        if (!hasContent) {
          const firstArray = Object.values(data).find(v => Array.isArray(v))
          if (firstArray) data = firstArray
        }
      }
      return normalizeData(data)
    } catch (inner) {
      console.error('JSON Repair Failed:', raw)
      throw inner
    }
  }
}

/**
 * Normalizes keys to ensure they match our internal schema (lowercase, etc.)
 */
function normalizeData(data) {
  if (Array.isArray(data)) return data.map(normalizeData)
  if (data !== null && typeof data === 'object') {
    const normalized = {}
    for (const key of Object.keys(data)) {
      const lowerKey = key.toLowerCase()
      let finalKey = lowerKey
      // Map variations
      if (lowerKey === 'header' || lowerKey === 'headline') finalKey = 'title'
      if (lowerKey === 'sub' || lowerKey === 'description') finalKey = 'subtitle'
      if (lowerKey === 'points' || lowerKey === 'items') finalKey = 'bullets'
      if (lowerKey === 'notes' || lowerKey === 'speakernote') finalKey = 'speaker_note'
      
      normalized[finalKey] = data[key]
    }
    return normalized
  }
  return data
}
