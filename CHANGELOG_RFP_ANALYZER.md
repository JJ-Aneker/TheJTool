# Changelog - RFP Analyzer

## 2026-11-26 - Refactorización Bedrock

### Problema Detectado
- Los modelos Claude 3.x en AWS Bedrock llegaron a EOL (End of Life)
- Los modelos Claude 4/5 no soportan invocación on-demand directa
- `analyze-rfp.js` usaba `InvokeModelCommand` (API antigua) en lugar del `bedrockClient.js` compartido

### Solución Implementada
✅ Refactorizado `analyze-rfp.js` para usar `callBedrock` del cliente compartido
✅ Ahora usa el mismo patrón que el resto de la aplicación (Document Generator, etc.)
✅ Modelo: `eu.anthropic.claude-haiku-4-5-20251001-v1:0` (Claude Haiku 4.5)
✅ Región: `eu-south-2` (Europa)
✅ API: `ConverseCommand` (nueva API de Bedrock)

### Beneficios
- ✅ **Código unificado**: Mismo cliente Bedrock para toda la app
- ✅ **Logging centralizado**: Uso registrado en tabla `anthropic_usage` de Supabase
- ✅ **Control de costos**: Tracking automático de tokens y costos USD
- ✅ **Privacidad**: Datos permanecen en AWS, no salen fuera
- ✅ **Mantenibilidad**: Un solo punto de configuración para todos los módulos

### Archivos Modificados
- `api/analyze-rfp.js` - Refactorizado para usar `callBedrock`
- `.env` - Región cambiada a `eu-south-2`
- `RFP_ANALYZER_MVP_README.md` - Documentación actualizada

### Testing
El módulo ahora comparte la misma infraestructura probada que:
- Document Generator (EFDT/Requirements/Budget/Commercial/Change Requests)
- eForm AI Generator
- Questionnaires Analyzer
- Licensing Configurator

### Notas Técnicas
**IMPORTANTE**: AWS Bedrock cambió su modelo de negocio:
- ❌ Claude 2/3/3.5: End of Life
- ❌ Claude 4/5 (formato simple): Solo Provisioned Throughput (muy caro)
- ✅ Cross-region inference profiles (formato `eu.anthropic.*`): Funciona con on-demand

**Formato correcto**:
- ❌ `anthropic.claude-sonnet-5` → No funciona
- ❌ `anthropic.claude-3-5-sonnet-20240620-v1:0` → EOL
- ✅ `eu.anthropic.claude-haiku-4-5-20251001-v1:0` → Funciona

**API correcta**:
- ❌ `InvokeModelCommand` → No soporta cross-region profiles
- ✅ `ConverseCommand` → Soporta cross-region profiles

### Próximos Pasos
Ninguno - el módulo está listo para uso en producción.
