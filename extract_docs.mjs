import fs from 'fs';
import * as PDFJS from 'pdfjs-dist';

PDFJS.GlobalWorkerOptions.workerSrc = './node_modules/pdfjs-dist/build/pdf.worker.min.js';

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
      const pdf = await PDFJS.getDocument({ data: buffer }).promise;
      
      let text = '';
      for (let i = 1; i <= Math.min(pdf.numPages, 5); i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map(item => item.str).join('') + '\n';
      }
      
      console.log(text.substring(0, 2000));
      console.log('\n[... contenido continúa ...]');
      
      const outfile = `${docsPath}/${file.replace('.pdf', '.txt')}`;
      fs.writeFileSync(outfile, text);
      console.log(`\n✓ Guardado: ${outfile}`);
      
    } catch (err) {
      console.log(`✗ Error: ${err.message}`);
    }
  }
})();
