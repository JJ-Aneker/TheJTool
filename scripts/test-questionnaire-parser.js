/**
 * Script de prueba standalone para el parser de cuestionarios Excel.
 *
 * Uso:
 *   node scripts/test-questionnaire-parser.js <ruta_al_fichero.xlsx>
 *
 * Ejemplo:
 *   node scripts/test-questionnaire-parser.js cuestionario_ing.xlsx
 *
 * Output:
 *   - Imprime las preguntas extraídas en consola
 *   - Genera fichero JSON con el resultado (<nombre>_preguntas.json)
 */

import { parseWorkbook } from '../api/_lib/questionnaires/excelParser.js';
import { writeFile } from 'fs/promises';

async function main() {
  const filePath = process.argv[2];

  if (!filePath) {
    console.error('Error: Debes proporcionar la ruta al fichero Excel');
    console.error('Uso: node scripts/test-questionnaire-parser.js <ruta_al_fichero.xlsx>');
    process.exit(1);
  }

  try {
    console.log(`\n📄 Procesando: ${filePath}\n`);

    const questions = await parseWorkbook(filePath);

    console.log(`✅ ${questions.length} preguntas extraídas\n`);

    // Estadísticas por confianza
    const alta = questions.filter(q => q.confidence === 'alta').length;
    const baja = questions.filter(q => q.confidence === 'baja').length;

    // Estadísticas por método
    const header = questions.filter(q => q.detection_method === 'header').length;
    const heuristic = questions.filter(q => q.detection_method === 'heuristic').length;

    // Estadísticas por hoja
    const bySheet = questions.reduce((acc, q) => {
      acc[q.sheet] = (acc[q.sheet] || 0) + 1;
      return acc;
    }, {});

    console.log('📊 Estadísticas:');
    console.log(`   Total: ${questions.length}`);
    console.log(`   Por confianza: alta=${alta}, baja=${baja}`);
    console.log(`   Por método: header=${header}, heuristic=${heuristic}`);
    console.log(`   Por hoja:`, bySheet);
    console.log('');

    // Mostrar primeras 10 preguntas como ejemplo
    console.log('📋 Primeras 10 preguntas extraídas:\n');
    questions.slice(0, 10).forEach((q, idx) => {
      console.log(`[${idx + 1}] ${q.sheet} (${q.detection_method}, confianza ${q.confidence}) ${q.cell_ref}`);
      if (q.section) {
        console.log(`    Sección: ${q.section}`);
      }
      if (q.question_id) {
        console.log(`    ID: ${q.question_id}`);
      }
      console.log(`    Pregunta: ${q.text.substring(0, 120)}${q.text.length > 120 ? '...' : ''}`);
      if (q.existing_answer) {
        console.log(`    Respuesta existente: ${q.existing_answer.substring(0, 80)}${q.existing_answer.length > 80 ? '...' : ''}`);
      }
      console.log(`    Celda destino respuesta: ${q.answer_cell_ref}`);
      console.log('');
    });

    if (questions.length > 10) {
      console.log(`   (... y ${questions.length - 10} preguntas más)\n`);
    }

    // Guardar JSON
    const baseName = filePath.replace(/\.xlsx?$/i, '');
    const outputPath = `${baseName}_preguntas.json`;

    await writeFile(
      outputPath,
      JSON.stringify(questions, null, 2),
      'utf-8'
    );

    console.log(`💾 JSON exportado a: ${outputPath}\n`);

    // Warnings de calidad
    console.log('⚠️  Revisar manualmente:');
    const lowConfidence = questions.filter(q => q.confidence === 'baja');
    if (lowConfidence.length > 0) {
      console.log(`   - ${lowConfidence.length} preguntas con confianza baja (modo heurístico)`);
    }
    const noSection = questions.filter(q => !q.section);
    if (noSection.length > 0) {
      console.log(`   - ${noSection.length} preguntas sin sección/categoría`);
    }
    const noId = questions.filter(q => !q.question_id);
    if (noId.length > 0) {
      console.log(`   - ${noId.length} preguntas sin ID de referencia`);
    }
    console.log('');

  } catch (err) {
    console.error('❌ Error procesando el fichero:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

main();
