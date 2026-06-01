const fs = require('fs');
const pdfParse = require('pdf-parse');

const docsPath = './docs/ejemplos';
const files = [
  'DOCAI_SoW_NNEE.pdf',
  'IVNEOS.pdf',
  'IVSIGN.pdf'
];

(async () => {
  for (const file of files) {
    const filepath = `${docsPath}/${file}`;
    if (!fs.existsSync(filepath)) {
      console.log(`⚠️  No encontrado: ${file}`);
      continue;
    }
    
    console.log(`\n${'='.repeat(80)}`);
    console.log(`📄 ${file}`);
    console.log('='.repeat(80));
    
    try {
      const buffer = fs.readFileSync(filepath);
      const data = await pdfParse(buffer);
      
      const text = data.text.substring(0, 2500);
      console.log(text);
      console.log('\n[... contenido continúa ...]');
      
      const outfile = `${docsPath}/${file.replace('.pdf', '.txt')}`;
      fs.writeFileSync(outfile, data.text);
      console.log(`\n✓ Guardado: ${outfile} (${data.text.length} caracteres)`);
      
    } catch (err) {
      console.log(`✗ Error: ${err.message}`);
    }
  }
})();
