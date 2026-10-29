// ── HANDLER ───────────────────────────────────────────────────────────────────
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).setHeaders(CORS).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { projectData, tipoDoc, portada, useDefaultPortada } = req.body;
    if (!projectData) return res.status(400).json({ error: 'projectData requerido' });

    console.log('[BUILD-DOCX] ═══════════════════════════════════════════════════')
    console.log('[BUILD-DOCX] Handler recibió:')
    console.log('[BUILD-DOCX] - portada?.storageUrl:', portada?.storageUrl)
    console.log('[BUILD-DOCX] - portada?.base64:', portada?.base64 ? `${portada.base64.substring(0, 50)}...` : null)
    console.log('[BUILD-DOCX] - useDefaultPortada:', useDefaultPortada)

    // Agregar portada a projectData si existe
    if (portada?.storageUrl) {
      // Descargar desde Storage
      console.log('[BUILD-DOCX] 🔄 Descargando portada desde Storage:', portada.storageUrl)
      try {
        const response = await fetch(portada.storageUrl)
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const arrayBuffer = await response.arrayBuffer()
        const base64 = Buffer.from(arrayBuffer).toString('base64')
        projectData.portada = {
          imgBase64: base64,
          width: portada.width,
          height: portada.height,
        }
        console.log('[BUILD-DOCX] ✅ Portada descargada:', base64.length, 'bytes')
        console.log('[BUILD-DOCX] ✅ projectData.portada seteado correctamente')
      } catch (err) {
        console.error('[BUILD-DOCX] ❌ Error descargando portada:', err)
      }
    } else if (portada?.base64) {
      // Fallback: base64 directo
      console.log('[BUILD-DOCX] 🔄 Usando base64 directo')
      projectData.portada = {
        imgBase64: portada.base64,
        width: portada.width,
        height: portada.height,
      }
      console.log('[BUILD-DOCX] ✅ projectData.portada seteado desde base64')
    } else {
      console.log('[BUILD-DOCX] ⚠️ NO HAY PORTADA - ni storageUrl ni base64')
    }

    if (useDefaultPortada) {
      projectData.useDefaultPortada = true;
      console.log('[BUILD-DOCX] ✅ useDefaultPortada activado')
    }
    if (tipoDoc) {
      projectData.tipoDoc = tipoDoc;
    }

    console.log('[BUILD-DOCX] Llamando a buildDocument()...')
    console.log('[BUILD-DOCX] ═══════════════════════════════════════════════════')

    const buffer = await buildDocument(projectData);
    const base64 = buffer.toString('base64');

    const cliente = projectData.cliente?.nombre || 'Cliente';
    const fecha = (projectData.proyecto?.fecha || '').replace(/\./g, '');
    const version = (projectData.proyecto?.version || 'v1_0').replace(/\./g, '_');
    const filename = `${cliente.replace(/\s+/g, '_')}_EFDT_${version}.docx`;

    Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));
    return res.status(200).json({ success: true, docxBase64: base64, filename });

  } catch (err) {
    Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));
    return res.status(500).json({ error: err.message, stack: err.stack?.substring(0, 500) });
  }
}
