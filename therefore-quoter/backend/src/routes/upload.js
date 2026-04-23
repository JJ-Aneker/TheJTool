const multer = require('multer');
const mammoth = require('mammoth');
const pdfParse = require('pdf-parse');
const fs = require('fs');
const path = require('path');

module.exports = (db) => {
  const express = require('express');
  const router = express.Router();

  // Setup multer for file uploads
  const uploadDir = path.join(__dirname, '../../uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
  });

  const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

  router.post('/', upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const filePath = req.file.path;
      const ext = path.extname(req.file.originalname).toLowerCase();

      let text = '';

      if (ext === '.txt') {
        text = fs.readFileSync(filePath, 'utf-8');
      } else if (ext === '.docx') {
        const docxData = await mammoth.extractRawText({ path: filePath });
        text = docxData.value;
      } else if (ext === '.pdf') {
        const pdfData = fs.readFileSync(filePath);
        const pdf = await pdfParse(pdfData);
        text = pdf.text;
      } else {
        return res.status(400).json({ error: 'Formato no soportado. Usa .txt, .docx o .pdf' });
      }

      // Clean up uploaded file
      fs.unlinkSync(filePath);

      res.json({
        success: true,
        text: text.substring(0, 10000), // Limit to 10k chars
        charCount: text.length
      });

    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  return router;
};
