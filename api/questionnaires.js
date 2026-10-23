/**
 * api/questionnaires.js
 * Endpoint unificado para Cuestionarios IT
 *
 * Rutas:
 * - POST /api/questionnaires?action=upload
 * - GET  /api/questionnaires?action=status&id=<id>
 * - POST /api/questionnaires?action=generate-answers&id=<id>
 * - GET  /api/questionnaires?action=download-excel&id=<id>
 * - DELETE /api/questionnaires?action=delete&id=<id>
 */

import uploadHandler from './_lib/questionnaires-handlers/upload.js'
import statusHandler from './_lib/questionnaires-handlers/status.js'
import generateAnswersHandler from './_lib/questionnaires-handlers/generate-answers.js'
import downloadExcelHandler from './_lib/questionnaires-handlers/download-excel.js'
import deleteHandler from './_lib/questionnaires-handlers/delete.js'

export default async function handler(req, res) {
  const action = req.query.action || ''
  const id = req.query.id

  // Para compatibilidad con rutas viejas: /api/questionnaires/:id/status
  // se puede detectar si viene de una ruta legacy
  const legacyMatch = req.url?.match(/\/questionnaires\/([^\/]+)\/(status|generate-answers|download-excel)/)

  if (legacyMatch) {
    // Ruta legacy: /api/questionnaires/:id/status
    req.query.id = legacyMatch[1]
    req.query.action = legacyMatch[2]

    switch (legacyMatch[2]) {
      case 'status':
        return statusHandler(req, res)
      case 'generate-answers':
        return generateAnswersHandler(req, res)
      case 'download-excel':
        return downloadExcelHandler(req, res)
    }
  }

  // Rutas con query params
  switch (action) {
    case 'upload':
      return uploadHandler(req, res)
    case 'status':
      return statusHandler(req, res)
    case 'generate-answers':
      return generateAnswersHandler(req, res)
    case 'download-excel':
      return downloadExcelHandler(req, res)
    case 'delete':
      return deleteHandler(req, res)
    default:
      return res.status(400).json({ error: `Acción desconocida: ${action}` })
  }
}
