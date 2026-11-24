/**
 * eformAiEdit.js
 * Edición de un eForm existente con IA a partir de una instrucción en lenguaje natural.
 * Lo usan api/eform-ai.js (Vercel) y routes/eformAi.js (desarrollo local).
 *
 * A diferencia de "refine", no necesita una generación previa guardada:
 * recibe los componentes form.io actuales directamente desde el editor.
 */

import { callBedrock } from './bedrockClient.js'
import { buildGenerateSystemPrompt, buildRefineUserMessage, buildValidationRetryMessage } from './eformAiPrompts.js'
import { parseCategoryXml, fieldsToAIContext } from './eformCategoryParser.js'
import { validateComponents } from './eformValidator.js'

export async function editEformComponents({
  components, instruction, environment = 'online', tenant, serverUrl, categoryXml, userId, extractJSON
}) {
  if (!Array.isArray(components) || !instruction || !String(instruction).trim()) {
    const err = new Error('Faltan parámetros: components, instruction')
    err.status = 400
    throw err
  }

  let categoryFields = []
  if (categoryXml) {
    const parsed = parseCategoryXml(categoryXml)
    categoryFields = fieldsToAIContext(parsed.fields)
  }

  const systemPrompt = buildGenerateSystemPrompt({ environment, tenant, serverUrl, blocks: [], categoryFields })
  const userMessage = buildRefineUserMessage({ components, instruction: String(instruction).trim() })
  const modelId = process.env.EFORM_AI_MODEL_ID || 'claude-sonnet-4-5'

  const response = await callBedrock({
    model: modelId,
    max_tokens: 16000,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }]
  }, { userId, module: 'eform-ai-edit' })

  const parsed = extractJSON(response.content[0].text)
  const newComponents = parsed.components || parsed
  if (!Array.isArray(newComponents)) {
    throw new Error('La IA no devolvió una lista de componentes válida')
  }

  const validate = (c) => validateComponents(c, { environment, categoryFields })
  const fixed = await autoFixComponents({
    system: systemPrompt, userMessage, firstText: response.content[0].text,
    components: newComponents, validation: validate(newComponents), validate,
    model: modelId, userId, module: 'eform-ai-edit', extractJSON
  })
  return { components: fixed.components, validation: fixed.validation, usage: response.usage }
}

/**
 * Si la validación encuentra errores (p. ej. <script> dentro de un htmlelement),
 * se le pide a la IA UNA vez que los corrija en la misma conversación.
 * Devuelve la versión corregida solo si tiene menos errores que la original.
 */
export async function autoFixComponents({ system, userMessage, firstText, components, validation, validate, model, userId, module, extractJSON }) {
  if (!validation?.errors?.length) return { components, validation, retried: false }
  try {
    const errors = validation.errors.map(e => (typeof e === 'string' ? e : (e.message || JSON.stringify(e))))
    const response = await callBedrock({
      model,
      max_tokens: 16000,
      system,
      messages: [
        { role: 'user', content: userMessage },
        { role: 'assistant', content: firstText },
        { role: 'user', content: buildValidationRetryMessage(errors) }
      ]
    }, { userId, module: `${module}-fix` })
    const parsed = extractJSON(response.content[0].text)
    const fixed = parsed.components || parsed
    if (!Array.isArray(fixed)) return { components, validation, retried: true }
    const fixedValidation = validate(fixed)
    if (fixedValidation.errors.length < validation.errors.length) {
      return { components: fixed, validation: fixedValidation, retried: true }
    }
  } catch (err) {
    console.error('autoFixComponents: no se pudo corregir', err.message)
  }
  return { components, validation, retried: true }
}
