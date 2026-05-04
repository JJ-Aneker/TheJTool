const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

module.exports = (db) => {
  const express = require('express');
  const router = express.Router();

  /**
   * POST /api/category-xml/generate
   * Genera un XML de categoría clonando desde la plantilla nativa
   *
   * Body:
   *   {
   *     nombre: "02 - Legal y Fiscal",
   *     ctgry_id: "Legal_Fiscal"
   *   }
   */
  router.post('/generate', async (req, res) => {
    try {
      const { nombre, ctgry_id } = req.body;

      if (!nombre || !ctgry_id) {
        return res.status(400).json({
          error: 'Missing required fields: nombre, ctgry_id'
        });
      }

      // Rutas a archivos
      const docsDir = path.join(__dirname, '../../../../docs/therefore');
      const templatePath = path.join(docsDir, 'TheConfiguration_categoria_PLANTILLA.xml');
      const clonePyPath = path.join(docsDir, 'clonar_categoria.py');

      // Verificar que existan
      if (!fs.existsSync(templatePath)) {
        return res.status(500).json({
          error: 'Plantilla XML no encontrada',
          path: templatePath
        });
      }

      if (!fs.existsSync(clonePyPath)) {
        return res.status(500).json({
          error: 'Script clonar_categoria.py no encontrado',
          path: clonePyPath
        });
      }

      // Crear archivo temporal para salida
      const tmpDir = os.tmpdir();
      const outputPath = path.join(tmpDir, `cat_${Date.now()}.xml`);

      // Ejecutar clonar_categoria.py vía Python
      const pythonScript = `
from clonar_categoria import clonar_categoria
import sys
sys.path.insert(0, '${docsDir}')

try:
    clonar_categoria(
        origen='${templatePath.replace(/\\/g, '\\\\')}',
        destino='${outputPath.replace(/\\/g, '\\\\')}',
        nuevo_nombre='${nombre.replace(/'/g, "\\'")}',
        nuevo_ctgry_id='${ctgry_id.replace(/'/g, "\\'")}'
    )
    print('OK')
except Exception as e:
    print(f'ERROR:{str(e)}')
    sys.exit(1)
`;

      // Ejecutar Python
      const python = spawn('python3', ['-c', pythonScript], {
        cwd: docsDir,
        timeout: 30000
      });

      let stdout = '';
      let stderr = '';

      python.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      python.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      python.on('close', (code) => {
        try {
          if (code !== 0 || !fs.existsSync(outputPath)) {
            return res.status(500).json({
              error: 'Error al generar XML',
              python_stderr: stderr,
              python_stdout: stdout
            });
          }

          // Leer el archivo generado
          const xmlContent = fs.readFileSync(outputPath, 'utf-8');

          // Eliminar archivo temporal
          fs.unlinkSync(outputPath);

          // Retornar el XML
          res.json({
            success: true,
            xml: xmlContent,
            nombre,
            ctgry_id
          });
        } catch (err) {
          res.status(500).json({
            error: 'Error al procesar resultado',
            message: err.message
          });
        }
      });

      python.on('error', (err) => {
        res.status(500).json({
          error: 'Error al ejecutar Python',
          message: err.message
        });
      });

    } catch (err) {
      res.status(500).json({
        error: err.message
      });
    }
  });

  return router;
};
