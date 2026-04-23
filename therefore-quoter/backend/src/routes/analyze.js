const Anthropic = require('@anthropic-ai/sdk');
const knowledgeService = require('../services/knowledgeService');

module.exports = (db) => {
  const express = require('express');
  const router = express.Router();

  router.post('/', async (req, res) => {
    try {
      const { notes, fileContent, answers } = req.body;

      if (!answers || !answers.cliente) {
        return res.status(400).json({ error: 'Faltan respuestas del cuestionario' });
      }

      knowledgeService.init();

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

      const message = await client.messages.create({
        model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6',
        max_tokens: 2000,
        messages,
        system: systemPrompt
      });

      let cleanedReply = message.content[0].text.trim();

      // Remove markdown wrappers
      cleanedReply = cleanedReply.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```$/, '');
      cleanedReply = cleanedReply.trim();

      // Extract JSON if wrapped
      const jsonMatch = cleanedReply.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanedReply = jsonMatch[0];
      }

      let estimacion;
      try {
        estimacion = JSON.parse(cleanedReply);
      } catch (e) {
        console.error('JSON parse error:', e.message);
        console.error('Response:', cleanedReply.substring(0, 300));
        return res.status(400).json({
          error: 'Error al procesar respuesta de IA',
          raw: cleanedReply.substring(0, 500)
        });
      }

      res.json(estimacion);

    } catch (error) {
      console.error('Error en analyze:', error);
      res.status(500).json({ error: error.message });
    }
  });

  return router;
};
