const Anthropic = require('@anthropic-ai/sdk');
const knowledgeService = require('../services/knowledgeService');

module.exports = (db) => {
  const express = require('express');
  const router = express.Router();

  router.post('/', async (req, res) => {
    try {
      console.log('📥 [analyze] Request recibido');
      console.log('📦 Payload:', JSON.stringify(req.body, null, 2).substring(0, 500));

      const { notes, fileContent, answers } = req.body;

      if (!answers || !answers.cliente) {
        console.error('❌ [analyze] Faltan respuestas');
        return res.status(400).json({ error: 'Faltan respuestas del cuestionario' });
      }

      console.log('✓ [analyze] Datos válidos. Cliente:', answers.cliente);
      console.log('⏳ [analyze] Inicializando knowledgeService...');

      knowledgeService.init();

      console.log('⏳ [analyze] Creando cliente Anthropic...');
      const client = new Anthropic.Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY
      });

      // Build context message from answers and notes
      const contextoProyecto = `CUESTIONARIO:
${Object.entries(answers).map(([k, v]) => `- ${k}: ${v}`).join('\n')}

${notes ? `NOTAS DEL USUARIO:\n${notes}\n` : ''}
${fileContent ? `CONTENIDO DOCUMENTO:\n${fileContent}\n` : ''}

Estima el esfuerzo necesario en días (8h/día) para cada tarea, basándote en la guía de Therefore™.`;

      // Get system prompt and few-shots
      const systemPrompt = knowledgeService.buildSystemPrompt();
      const fewShots = knowledgeService.buildFewShots();

      // Combine few-shots with user message
      const messages = [
        ...fewShots,
        {
          role: 'user',
          content: contextoProyecto
        }
      ];

      console.log('🤖 [analyze] Llamando a Claude...');
      console.log('   Model:', process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6');
      console.log('   Messages count:', messages.length);

      const start = Date.now();
      const message = await client.messages.create({
        model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6',
        max_tokens: 2000,
        messages,
        system: systemPrompt
      });
      const elapsed = Date.now() - start;
      console.log(`✅ [analyze] Claude respondió en ${elapsed}ms`);

      let cleanedReply = message.content[0].text.trim();

      // Remove markdown wrappers
      cleanedReply = cleanedReply.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```$/, '');
      cleanedReply = cleanedReply.trim();

      // Extract JSON if wrapped
      const jsonMatch = cleanedReply.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanedReply = jsonMatch[0];
      }

      console.log('📝 [analyze] Procesando respuesta...');
      console.log('   Raw response length:', message.content[0].text.length);

      let estimacion;
      try {
        estimacion = JSON.parse(cleanedReply);
        console.log('✅ [analyze] JSON parseado correctamente');
        console.log('   Proyecto:', estimacion.titulo);
      } catch (e) {
        console.error('❌ [analyze] JSON parse error:', e.message);
        console.error('Response sample:', cleanedReply.substring(0, 300));
        return res.status(400).json({
          error: 'Error al procesar respuesta de IA',
          raw: cleanedReply.substring(0, 500)
        });
      }

      console.log('📤 [analyze] Enviando respuesta al cliente...');
      res.json(estimacion);

    } catch (error) {
      console.error('❌ [analyze] Error:', error.message);
      console.error('Stack:', error.stack);
      res.status(500).json({
        error: error.message,
        type: error.constructor.name
      });
    }
  });

  return router;
};
