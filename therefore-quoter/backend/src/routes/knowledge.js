const knowledgeService = require('../services/knowledgeService');

module.exports = (db) => {
  const express = require('express');
  const router = express.Router();

  // GET entire knowledge base
  router.get('/', (req, res) => {
    try {
      const kb = knowledgeService.getFullKnowledgeBase();
      res.json(kb);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET guide only
  router.get('/guide', (req, res) => {
    try {
      const guide = knowledgeService.getGuide();
      res.json(guide);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // PUT update guide
  router.put('/guide', (req, res) => {
    try {
      const { ratios } = req.body;

      if (!Array.isArray(ratios)) {
        return res.status(400).json({ error: 'ratios debe ser un array' });
      }

      const currentGuide = knowledgeService.getGuide();

      // Transform ratios back to tareas format for storage
      const tareas = ratios.map(r => ({
        tipo: r.id,
        label: r.nombre,
        notas: r.descripcion,
        dias_min: r.diasMin,
        dias_max: r.diasMax,
        perfil: r.perfilRecomendado
      }));

      const updatedGuide = {
        ...currentGuide,
        tareas,
        updated: new Date().toISOString().split('T')[0]
      };

      // Remove ratios from storage (keep only tareas)
      delete updatedGuide.ratios;

      knowledgeService.updateGuide(updatedGuide);
      res.json({ success: true, guide: knowledgeService.getGuide() });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET examples
  router.get('/examples', (req, res) => {
    try {
      const examples = knowledgeService.getExamples();
      res.json(examples);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET single example
  router.get('/examples/:id', (req, res) => {
    try {
      const examples = knowledgeService.getExamples();
      const example = examples.examples.find(ex => ex.id === req.params.id);

      if (!example) {
        return res.status(404).json({ error: 'Example not found' });
      }

      res.json(example);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST add new example
  router.post('/examples', (req, res) => {
    try {
      const { id, nombre, año, tipo, plataforma, contexto, input, output, totalDias, totalImporte, tarifa } = req.body;

      if (!nombre || !tipo || !plataforma) {
        return res.status(400).json({ error: 'nombre, tipo, plataforma son obligatorios' });
      }

      const newExample = {
        id: id || `ref_${Date.now()}`,
        nombre,
        año: año || new Date().getFullYear(),
        tipo,
        plataforma,
        contexto: contexto || '',
        input: input || {},
        output: output || {},
        totalDias: totalDias || 0,
        totalImporte: totalImporte || 0,
        tarifa: tarifa || 800
      };

      knowledgeService.addExample(newExample);
      res.status(201).json({ success: true, example: newExample });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // PUT update example
  router.put('/examples/:id', (req, res) => {
    try {
      const examples = knowledgeService.getExamples();
      const exampleIndex = examples.examples.findIndex(ex => ex.id === req.params.id);

      if (exampleIndex === -1) {
        return res.status(404).json({ error: 'Example not found' });
      }

      const updatedExample = {
        ...examples.examples[exampleIndex],
        ...req.body
      };

      examples.examples[exampleIndex] = updatedExample;
      knowledgeService.examples = examples;

      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(__dirname, '../knowledge/examples.json');
      fs.writeFileSync(filePath, JSON.stringify(examples, null, 2));

      res.json({ success: true, example: updatedExample });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // DELETE example
  router.delete('/examples/:id', (req, res) => {
    try {
      const examples = knowledgeService.getExamples();
      const exampleIndex = examples.examples.findIndex(ex => ex.id === req.params.id);

      if (exampleIndex === -1) {
        return res.status(404).json({ error: 'Example not found' });
      }

      examples.examples.splice(exampleIndex, 1);
      knowledgeService.examples = examples;

      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(__dirname, '../knowledge/examples.json');
      fs.writeFileSync(filePath, JSON.stringify(examples, null, 2));

      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET clauses
  router.get('/clauses', (req, res) => {
    try {
      const clauses = knowledgeService.getClauses();
      res.json(clauses);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET supuestos for a tipo
  router.get('/supuestos/:tipo', (req, res) => {
    try {
      const supuestos = knowledgeService.getSupuestosForType(req.params.tipo);
      res.json({ tipo: req.params.tipo, supuestos });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET system prompt preview
  router.get('/system-prompt', (req, res) => {
    try {
      const prompt = knowledgeService.buildSystemPrompt();
      res.json({ systemPrompt: prompt });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};
