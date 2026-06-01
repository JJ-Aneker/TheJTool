import fs from 'fs';
import pdfParse from 'pdf-parse';

const docsPath = './docs/ejemplos';
const files = [
  'DOCAI_SoW_NNEE.pdf',
  'IVNEOS.pdf',
  'IVSIGN.pdf'
];

(async () => {
  for (const file of files) {
    const filepath = `${docsPath}/${file}`;
    if (!fs.existsSync(filepath)) continue;
    
    console.log(`\n${'='.repeat(80)}`);
    console.log(`📄 ${file}`);
    console.log('='.repeat(80));
    
    try {
      const buffer = fs.readFileSync(filepath);
      const data = await pdfParse(buffer);
      
      // Extraer primeras 3000 caracteres
      const text = data.text.substring(0, 3000);
      console.log(text);
      console.log('\n[... contenido continúa ...]');
      
      // Guardar archivo completo
      const outfile = `${docsPath}/${file.replace('.pdf', '.txt')}`;
      fs.writeFileSync(outfile, data.text);
      console.log(`\n✓ Guardado: ${outfile}`);
      
    } catch (err) {
      console.log(`✗ Error: ${err.message}`);
    }
  }
})();
