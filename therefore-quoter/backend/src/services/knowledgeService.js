const fs = require('fs');
const path = require('path');

class KnowledgeService {
  constructor() {
    this.guide = null;
    this.examples = null;
    this.clauses = null;
    this.load();
  }

  load() {
    try {
      const guideFile = path.join(__dirname, '../knowledge/guide.json');
      const examplesFile = path.join(__dirname, '../knowledge/examples.json');
      const clausesFile = path.join(__dirname, '../knowledge/clauses.json');

      this.guide = JSON.parse(fs.readFileSync(guideFile, 'utf-8'));
      this.examples = JSON.parse(fs.readFileSync(examplesFile, 'utf-8'));
      this.clauses = JSON.parse(fs.readFileSync(clausesFile, 'utf-8'));

      console.log('✓ Knowledge base loaded (guide, examples, clauses)');
    } catch (err) {
      console.error('Error loading knowledge base:', err.message);
      throw err;
    }
  }

  init() {
    // Already loaded in constructor, but allow explicit init call
  }

  buildSystemPrompt() {
    const tareasText = this.guide.tareas
      .map(t => `- ${t.label} (${t.dias_min}-${t.dias_max}d, ${t.perfil}): ${t.notas}`)
      .join('\n');

    const prompt = `Eres consultor experto en implantaciones Therefore™ (Canon).

## Guía Maestra de Esfuerzo (validada ${this.guide.fecha_validacion})

### Tareas de Implementación
${tareasText}

### Tarifa Base
- €${this.guide.tarifa_default}/día (jornada de ${this.guide.horas_jornada}h)
- Proyectos de referencia: ${this.guide.proyectos_referencia.join(', ')}

## Proyectos de Referencia Real

Los siguientes son casos reales usados para calibrar estimaciones:

${this.examples.examples.map((ex, idx) => `
**${idx + 1}. ${ex.nombre} (${ex.año})**
   - Tipo: ${ex.tipo === 'nuevo' ? '🆕 Nuevo' : '📈 Evolutivo'} | Plataforma: ${ex.plataforma === 'online' ? '☁️ Online' : '🖥️ On-Premise'}
   - Contexto: ${ex.contexto}
   - Total esfuerzo: ${ex.totalDias} días (€${ex.totalImporte})
   - Input: ${JSON.stringify(ex.input)}
`).join('\n')}

## Instrucciones de Análisis

**Tu tarea:** Analizar requisitos del cliente y estimar esfuerzo en días.

**Entrada:**
- Respuestas al cuestionario (cliente, tipo, plataforma, ERP, usuarios, eForms, firma, enfoque)
- Documentación/contexto del proyecto
- Notas adicionales

**Proceso:**
1. Comparar con proyectos de referencia (similitud en tipo, plataforma, complejidad)
2. Desglosar en bloques de tareas usando la guía maestra
3. Asignar perfiles: SA (Senior Architect) | Consultor | Formación
4. Validar que el total sea realista frente a referencias

**Respuesta requerida (SOLO JSON, sin markdown):**
{
  "cliente": "string",
  "tipo": "nuevo|evolutivo",
  "plataforma": "online|onpremise",
  "titulo": "string",
  "objeto": "descripción detallada (100-200 chars min)",
  "bloques": [
    {
      "grupo": "nombre grupo (Análisis, Estructura, Automatización, Integración, Usuarios, Formación, etc)",
      "label": "nombre corto",
      "tareas": [
        { "cod": "A001", "desc": "descripción", "perfil": "SA|Consultor|Formación", "dias": number, "horas": number }
      ]
    }
  ],
  "exclusiones": ["string", ...],
  "supuestos": ["string", ...]
}

**Reglas críticas:**
- Responde SOLO JSON. Sin markdown, sin explicaciones, sin caracteres de código.
- Horas = días × 8
- Total días debe ser realista (±20% de proyectos de referencia con contexto similar)
- Usa códigos: A=Análisis, C=Categorías, W=Workflows, I=Integración, U=Usuarios, T=Training/UAT
`;

    return prompt;
  }

  buildFewShots() {
    return this.examples.examples.map((ex, idx) => {
      const userMsg = {
        role: 'user',
        content: `Cliente: ${ex.input.cliente}
Tipo: ${ex.input.tipo}
Plataforma: ${ex.input.plataforma}
ERP: ${ex.input.erp}
Usuarios: ${ex.input.usuarios}
eForms: ${ex.input.eforms}
Firma: ${ex.input.firma}
Enfoque: ${ex.input.enfoque}

Estima el esfuerzo necesario en días y horas.`
      };

      const assistantMsg = {
        role: 'assistant',
        content: JSON.stringify(ex.output, null, 2)
      };

      return [userMsg, assistantMsg];
    }).flat();
  }

  getSupuestosForType(tipo) {
    const base = this.clauses.supuestosBase.todos || [];
    const specific = this.clauses.supuestosBase[tipo] || [];
    return [...base, ...specific];
  }

  getExclusionesDefault() {
    const clauses = this.clauses.exclusionesComunes;
    return [
      ...(clauses.tecnicas || []),
      ...(clauses.funcionales || []),
      ...(clauses.servicios || [])
    ];
  }

  getConfidentiality() {
    return this.clauses.confidencialidad.contenido;
  }

  updateGuide(newGuide) {
    const filePath = path.join(__dirname, '../knowledge/guide.json');
    newGuide.updated = new Date().toISOString().split('T')[0];
    fs.writeFileSync(filePath, JSON.stringify(newGuide, null, 2));
    this.guide = newGuide;
    return newGuide;
  }

  addExample(newExample) {
    newExample.id = newExample.id || `ref_${Date.now()}`;
    this.examples.examples.push(newExample);
    const filePath = path.join(__dirname, '../knowledge/examples.json');
    fs.writeFileSync(filePath, JSON.stringify(this.examples, null, 2));
    return newExample;
  }

  getGuide() {
    // Transform tareas to ratios format for frontend compatibility
    if (this.guide.tareas && !this.guide.ratios) {
      return {
        ...this.guide,
        ratios: this.guide.tareas.map(t => ({
          id: t.tipo,
          nombre: t.label,
          descripcion: t.notas,
          diasMin: t.dias_min,
          diasMax: t.dias_max,
          perfilRecomendado: t.perfil
        }))
      };
    }
    return this.guide;
  }

  getExamples() {
    return this.examples;
  }

  getClauses() {
    return this.clauses;
  }

  getFullKnowledgeBase() {
    return {
      guide: this.guide,
      examples: this.examples,
      clauses: this.clauses
    };
  }
}

const knowledgeService = new KnowledgeService();
module.exports = knowledgeService;
