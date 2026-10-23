# Generador de eForms IA — Instrucciones de puesta en marcha

Paquete preparado para construir el módulo con Claude Code en VSCode.

## Contenido

| Ruta | Qué es |
|------|--------|
| `SPEC.md` | Especificación funcional y técnica del módulo |
| `PROMPT-CLAUDE-CODE.md` | Prompt listo para pegar en Claude Code |
| `knowledge/eform-rules.md` | Reglas técnicas de eForms (se usan como contexto de la IA) |
| `knowledge/formio-components.md` | Componentes admitidos y plantillas base |
| `knowledge/patterns.md` | Patrones probados: QR, autorrelleno, maestro, modal, firma |
| `knowledge/ai-prompts.md` | Borradores de los prompts de sistema de la IA |
| `reference/generar_eform.py` | Generador Python original (se porta a Node) |
| `reference/TheConfiguration_eformMatriculas_PLANTILLA.xml` | Plantilla nativa por defecto* |
| `supabase/eform_generations.sql` | Tabla de historial + RLS solo admins |

\* La plantilla conserva intacta la estructura nativa exportada (cabecera, metadatos,
`FCreUs`/`FCreUsNam`, etc.); solo se ha simplificado el contenido del `FDef`, que el
generador sustituye siempre.

## Pasos

1. **Descomprime** el ZIP en `C:\Github\TheJTool` (se crea `docs\eform-generator-ia\`).
2. Abre VSCode en `C:\Github\TheJTool` y crea la rama:
   `git checkout -b feature/eform-generator-ia`
3. Abre **Claude Code**, pega el prompt de `PROMPT-CLAUDE-CODE.md` y revisa el plan que
   te proponga antes de dar el OK.
4. En **Supabase → SQL Editor**, ejecuta `supabase/eform_generations.sql`
   (revisa antes la función `is_admin()` si tu tabla `profiles` no usa `role = 'admin'`).
5. Añade la variable `EFORM_AI_MODEL_ID` en `.env` y en Vercel si Claude Code la crea
   (por defecto usará el Sonnet de Bedrock que ya tengas configurado).
6. Prueba con: *"Crea un eForm para el registro de libros que además lea QRs"* e importa el
   XML resultante en el Solution Designer de un entorno de pruebas.

## Recordatorios

- **On-Premise**: sube siempre una plantilla exportada de esa instancia (lleva `DefSubmNo`;
  sin ella la importación falla con error SQL 547).
- Si el FormID ya existe en la instancia, cámbialo antes de importar.
- Cuando el eForm se pruebe en real y aparezca una regla nueva, añádela a
  `knowledge/eform-rules.md`: la IA mejora con cada lección aprendida.

- ✅ **Supabase ya configurado** (22/10/2026): `supabase/eform_generations.sql` ejecutado correctamente (tabla `eform_generations`, función `is_admin()` con `profiles.user_id` y políticas RLS). No volver a ejecutarlo salvo para recrear la base de datos.