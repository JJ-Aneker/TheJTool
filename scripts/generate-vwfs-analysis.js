import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, convertInchesToTwip } from 'docx'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Crear documento
const doc = new Document({
  sections: [{
    properties: {
      page: {
        margin: {
          top: convertInchesToTwip(1),
          right: convertInchesToTwip(1),
          bottom: convertInchesToTwip(1),
          left: convertInchesToTwip(1)
        }
      }
    },
    children: [
      // Título principal
      new Paragraph({
        text: 'Análisis RFP: VWFS - Facturación Electrónica Ley Crea y Crece',
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
        spacing: { after: 300 }
      }),
      new Paragraph({
        text: 'Informe de Viabilidad go/no-go',
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 }
      }),
      new Paragraph({
        text: 'Canon / TheJay Consulting',
        alignment: AlignmentType.CENTER,
        spacing: { after: 600 }
      }),
      new Paragraph({
        text: `Fecha: ${new Date().toLocaleDateString('es-ES')}`,
        alignment: AlignmentType.CENTER,
        spacing: { after: 800 }
      }),

      // 1. RESUMEN Y RECOMENDACIÓN
      new Paragraph({
        text: '1. RESUMEN Y RECOMENDACIÓN',
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: 'Recomendación: ', bold: true, size: 28 }),
          new TextRun({ text: 'NO-GO', bold: true, size: 28, color: 'DC2626' })
        ],
        spacing: { after: 200 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: 'Qué busca el cliente: ', bold: true }),
          new TextRun({ text: 'Plataforma integral de facturación electrónica B2B que cumpla Ley 18/2022 (Crea y Crece) y RD 238/2026, interoperable con SEFE/AEAT, con portal masivo para proveedores y actualización regulatoria automática sin coste adicional.' })
        ],
        spacing: { after: 200 }
      }),

      new Paragraph({
        text: 'Motivos del NO-GO:',
        bold: true,
        spacing: { before: 200, after: 100 }
      }),
      new Paragraph({
        text: '1. Therefore™ NO es plataforma SEFE homologada',
        bullet: { level: 0 },
        spacing: { after: 100 }
      }),
      new Paragraph({
        text: 'La normativa exige intercambio a través de plataformas certificadas del Sistema Español de Factura Electrónica. Therefore™ es un DMS (Document Management System), no una plataforma de facturación electrónica. Solo cubre archivo y custodia del resultado final.',
        spacing: { after: 200 }
      }),

      new Paragraph({
        text: '2. Rendimiento no garantizable con el volumen exigido',
        bullet: { level: 0 },
        spacing: { after: 100 }
      }),
      new Paragraph({
        text: '1.3M facturas/año (780k emitidas + 500k recibidas) con SLA < 5 segundos por documento no es viable en Therefore Online sin arquitectura dedicada costosa. El cliente exige disponibilidad 99.9% con penalizaciones automáticas por incumplimiento.',
        spacing: { after: 200 }
      }),

      new Paragraph({
        text: '3. Portal web para miles de proveedores externos',
        bullet: { level: 0 },
        spacing: { after: 100 }
      }),
      new Paragraph({
        text: 'El pliego requiere portal web para proveedores (carga masiva, vigilancia de buzones, consulta de estado de pago). Esto NO es "configuración" de Therefore™ sino desarrollo complejo de aplicación web con autenticación masiva y escalabilidad.',
        spacing: { after: 200 }
      }),

      new Paragraph({
        text: '4. Actualizaciones regulatorias sin coste adicional',
        bullet: { level: 0 },
        spacing: { after: 100 }
      }),
      new Paragraph({
        text: 'El pliego establece: "El proveedor asumirá sin coste extraordinario las adaptaciones derivadas de cambios regulatorios que afecten a los requisitos legales básicos de la facturación electrónica obligatoria" (pág. 11). Therefore™ no tiene esta capacidad autónoma.',
        spacing: { after: 200 }
      }),

      new Paragraph({
        text: '5. Riesgo regulatorio y penalizaciones desproporcionadas',
        bullet: { level: 0 },
        spacing: { after: 100 }
      }),
      new Paragraph({
        text: 'Las penalizaciones se aplican sobre el TOTAL del servicio, cuando nuestra parte sería únicamente archivo/custodia (minoritaria). Service Credits de hasta 100% factura mensual por incumplimientos. RPO ≤1h, RTO ≤4h son exigencias de continuidad que dependen 100% del fabricante.',
        spacing: { after: 200 }
      }),

      new Paragraph({
        text: '6. Dependencias críticas del fabricante (Canon)',
        bullet: { level: 0 },
        spacing: { after: 100 }
      }),
      new Paragraph({
        text: 'IT-STD, SIEM, SBOM por versión, SAST/SCA/DAST/pentest, mTLS, PAM, KMS/HSM, DORA: TODO depende de evidencias que Canon/Therefore debe aportar. Sin ellas, no hay go-live. No controlamos el roadmap de seguridad del fabricante.',
        spacing: { after: 400 }
      }),

      new Paragraph({
        children: [
          new TextRun({ text: 'Lo aprovechable: ', bold: true }),
          new TextRun({ text: 'Si VWFS adjudicara a un tercero homologado (ej: Edicom, Pagero) y solo buscara DMS para archivo/custodia posterior, Therefore™ encaja. Pero eso sería un proyecto separado, NO esta RFP.' })
        ],
        spacing: { after: 400 }
      }),

      // 2. QUÉ PIDE EL CLIENTE
      new Paragraph({
        text: '2. QUÉ PIDE EL CLIENTE',
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 }
      }),

      new Paragraph({
        text: '2.1. Cliente y Objeto',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: 'Cliente: ', bold: true }),
          new TextRun({ text: 'Volkswagen Financial Services Spain (VWFS)' })
        ],
        spacing: { after: 50 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: 'Objeto: ', bold: true }),
          new TextRun({ text: 'Implantación de solución integral de facturación electrónica B2B conforme Ley 18/2022 (Crea y Crece) y RD 238/2026' })
        ],
        spacing: { after: 50 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: 'Entidades: ', bold: true }),
          new TextRun({ text: '3 entidades legales (VWR, VWB, VWIS)' })
        ],
        spacing: { after: 50 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: 'Duración: ', bold: true }),
          new TextRun({ text: '3 años + 2 años prórroga opcional (máx 5 años sin concursar)' })
        ],
        spacing: { after: 300 }
      }),

      new Paragraph({
        text: '2.2. Volúmenes',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 }
      }),
      new Paragraph({
        text: 'Facturas emitidas (B2B): 780.000/año',
        bullet: { level: 0 },
        spacing: { after: 50 }
      }),
      new Paragraph({
        text: 'VWR: 600.000',
        bullet: { level: 1 },
        spacing: { after: 50 }
      }),
      new Paragraph({
        text: 'VWB: 180.000',
        bullet: { level: 1 },
        spacing: { after: 50 }
      }),
      new Paragraph({
        text: 'VWIS: 0',
        bullet: { level: 1 },
        spacing: { after: 100 }
      }),
      new Paragraph({
        text: 'Facturas recibidas (B2B): 499.800/año',
        bullet: { level: 0 },
        spacing: { after: 50 }
      }),
      new Paragraph({
        text: 'VWR: 480.000',
        bullet: { level: 1 },
        spacing: { after: 50 }
      }),
      new Paragraph({
        text: 'VWB: 18.000',
        bullet: { level: 1 },
        spacing: { after: 50 }
      }),
      new Paragraph({
        text: 'VWIS: 1.800',
        bullet: { level: 1 },
        spacing: { after: 100 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: 'TOTAL: 1.279.800 facturas/año ', bold: true }),
          new TextRun({ text: '(~106.650 facturas/mes, ~3.555 facturas/día laborable)', color: '6B7280' })
        ],
        spacing: { after: 300 }
      }),

      new Paragraph({
        text: '2.3. Calendario y Hitos Críticos',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 }
      }),
      new Paragraph({
        text: '• Envío pliego: 03/11/2026',
        spacing: { after: 50 }
      }),
      new Paragraph({
        text: '• Consultas proveedores: hasta 10/11/2026',
        spacing: { after: 50 }
      }),
      new Paragraph({
        text: '• Recepción ofertas iniciales: 20/11/2026',
        spacing: { after: 50 }
      }),
      new Paragraph({
        text: '• Defensa propuestas: 23-27/11/2026',
        spacing: { after: 50 }
      }),
      new Paragraph({
        text: '• Ofertas finales: 08/12/2026',
        spacing: { after: 50 }
      }),
      new Paragraph({
        text: '• Adjudicación: TBD',
        spacing: { after: 50 }
      }),
      new Paragraph({
        text: '• Inicio servicio: 2027 (entrará en vigor 01/10/2027 para empresas > 8M€ facturación)',
        spacing: { after: 300 }
      }),

      new Paragraph({
        children: [
          new TextRun({ text: '⚠️ Plazo de consultas: 7 días. ', bold: true, color: 'DC2626' }),
          new TextRun({ text: 'Si hay dudas bloqueantes, deben enviarse ANTES del 10/11/2026.', color: 'DC2626' })
        ],
        spacing: { after: 400 }
      }),

      // 3. MATRIZ DE ENCAJE
      new Paragraph({
        text: '3. MATRIZ DE ENCAJE',
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 }
      }),

      new Paragraph({
        children: [
          new TextRun({ text: 'Resumen: ', bold: true }),
          new TextRun({ text: 'De 19 requisitos principales: ' }),
          new TextRun({ text: '1 Cubre (5%)', bold: true, color: '059669' }),
          new TextRun({ text: ', ' }),
          new TextRun({ text: '5 Parcial (26%)', bold: true, color: 'D97706' }),
          new TextRun({ text: ', ' }),
          new TextRun({ text: '9 Con socio (47%)', bold: true, color: '2563EB' }),
          new TextRun({ text: ', ' }),
          new TextRun({ text: '4 No cubre (21%)', bold: true, color: 'DC2626' })
        ],
        spacing: { after: 300 }
      }),

      new Paragraph({
        text: 'REQUISITO | ENCAJE | COMENTARIO | PÁGINA',
        bold: true,
        spacing: { after: 100 }
      }),
      new Paragraph({
        text: '────────────────────────────────────────────────────────────',
        spacing: { after: 100 }
      }),

      new Paragraph({
        text: 'Archivo y custodia documental | Cubre | Therefore™ nativo con retención y auditoría | 7',
        spacing: { after: 100 }
      }),

      new Paragraph({
        text: 'Plataforma SEFE homologada | No cubre | Therefore™ NO es plataforma de intercambio SEFE | 4',
        spacing: { after: 100 }
      }),

      new Paragraph({
        text: 'Emisión formato UBL/CII/Facturae | Con socio | Requiere plataforma tercera (ej: Edicom, Pagero) | 7',
        spacing: { after: 100 }
      }),

      new Paragraph({
        text: 'Recepción facturas B2B | Con socio | Idem emisión, intercambio vía plataforma certificada | 7',
        spacing: { after: 100 }
      }),

      new Paragraph({
        text: 'Gestión estados factura (emitida/recibida/aceptada/rechazada/pagada) | Con socio | Lógica de negocio en plataforma SEFE, Therefore solo almacena | 15',
        spacing: { after: 100 }
      }),

      new Paragraph({
        text: 'Portal web para proveedores | No cubre | Portal masivo para miles de usuarios externos = desarrollo complejo | 5',
        spacing: { after: 100 }
      }),

      new Paragraph({
        text: 'Firma digital delegada | Con socio | Requiere proveedor certificado de firma (ej: Uanataca) | 5',
        spacing: { after: 100 }
      }),

      new Paragraph({
        text: 'Integración SAP R/3 y SAP S/4 | Parcial | Therefore tiene conectores SAP pero requieren customización por flujo | 13',
        spacing: { after: 100 }
      }),

      new Paragraph({
        text: 'Integración IDMC (middleware) | Parcial | APIs REST disponibles, mapeos específicos a cargo del proyecto | 13',
        spacing: { after: 100 }
      }),

      new Paragraph({
        text: 'Procesamiento < 5s por factura | No cubre | Therefore Online con 1.3M docs/año no garantiza < 5s por documento | 13',
        spacing: { after: 100 }
      }),

      new Paragraph({
        text: 'Disponibilidad 99.9% | Parcial | Therefore Online SLA Canon, OnPremise depende de infraestructura cliente | 11',
        spacing: { after: 100 }
      }),

      new Paragraph({
        text: 'RPO ≤1h, RTO ≤4h | Parcial | Depende de SLA fabricante (Online) o infraestructura (OnPremise) | 15',
        spacing: { after: 100 }
      }),

      new Paragraph({
        text: 'Integración SIEM corporativo | Parcial | Therefore tiene logging, requiere conector custom al SIEM de VWFS | 12',
        spacing: { after: 100 }
      }),

      new Paragraph({
        text: 'IT-STD corporativos VWFS | Con socio | Depende de Canon aportar matriz requisito-control-evidencia por versión | 6',
        spacing: { after: 100 }
      }),

      new Paragraph({
        text: 'SSDLC (SAST/SCA/DAST/pentest/SBOM) | Con socio | Depende de Canon entregar SBOM y resultados escaneo por versión | 9',
        spacing: { after: 100 }
      }),

      new Paragraph({
        text: 'mTLS, PAM, KMS/HSM | Con socio | Depende de Canon soportar mTLS, integrar PAM y usar KMS para claves | 14',
        spacing: { after: 100 }
      }),

      new Paragraph({
        text: 'RGPD/DORA | Parcial | RGPD: cumple básico. DORA: depende Canon evidencias resiliencia ICT | 13',
        spacing: { after: 100 }
      }),

      new Paragraph({
        text: 'Actualización regulatoria sin coste | No cubre | Cambios legales específicos requieren desarrollo o tercero, NO automático | 11',
        spacing: { after: 100 }
      }),

      new Paragraph({
        text: 'Referencias sector financiero/facturación electrónica | Con socio | Kutxabank (Smart Capture facturas proveedor) NO es plataforma SEFE | 16',
        spacing: { after: 400 }
      }),

      // 4. BRECHAS BLOQUEANTES
      new Paragraph({
        text: '4. BRECHAS BLOQUEANTES',
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 }
      }),

      new Paragraph({
        children: [
          new TextRun({ text: '1. No somos plataforma SEFE homologada', bold: true })
        ],
        spacing: { after: 100 }
      }),
      new Paragraph({
        text: 'La Ley 18/2022 y el RD 238/2026 exigen que el intercambio de facturas B2B se realice a través del Sistema Español de Factura Electrónica (SEFE), conformado por plataformas privadas certificadas + solución pública AEAT. Therefore™ es un DMS, NO una plataforma de facturación electrónica. Solo podemos almacenar el resultado final, pero NO emitir, intercambiar ni gestionar estados de factura conforme a la normativa.',
        spacing: { after: 300 }
      }),

      new Paragraph({
        children: [
          new TextRun({ text: '2. Rendimiento no garantizable', bold: true })
        ],
        spacing: { after: 100 }
      }),
      new Paragraph({
        text: 'El pliego exige procesar 1.3M facturas/año con SLA < 5 segundos por documento y disponibilidad 99.9%. Therefore Online no ofrece garantías de rendimiento a ese volumen sin arquitectura dedicada (costosa). Los Service Credits por incumplimiento son hasta 100% factura mensual.',
        spacing: { after: 300 }
      }),

      new Paragraph({
        children: [
          new TextRun({ text: '3. Portal web para miles de proveedores externos', bold: true })
        ],
        spacing: { after: 100 }
      }),
      new Paragraph({
        text: 'El pliego requiere portal web para proveedores con: facturas, estado de pago, incidencias, carga masiva, promociones comerciales. También vigilancia de buzones de correo para recepción automática. Esto NO es "configuración" de Therefore™ sino desarrollo complejo de aplicación web con autenticación masiva, escalabilidad y UX dedicada.',
        spacing: { after: 300 }
      }),

      new Paragraph({
        children: [
          new TextRun({ text: '4. Arquitectura "capa fina" del cliente', bold: true })
        ],
        spacing: { after: 100 }
      }),
      new Paragraph({
        text: 'VWFS establece (pág. 7): "La plataforma actuará como capa de cumplimiento regulatorio e interoperabilidad. El gobierno del modelo de negocio asociado a las facturas, sus estados y eventos de pago permanecerá bajo responsabilidad de VWFS, evitando dependencias funcionales sobre componentes propietarios del proveedor." Therefore™ requeriría integraciones profundas con SAP que crean dependencia (vendor lock-in), contrario al principio arquitectónico del cliente.',
        spacing: { after: 300 }
      }),

      new Paragraph({
        children: [
          new TextRun({ text: '5. Actualizaciones regulatorias sin coste', bold: true })
        ],
        spacing: { after: 100 }
      }),
      new Paragraph({
        text: 'El pliego (pág. 11): "El proveedor asumirá sin coste extraordinario las adaptaciones derivadas de cambios regulatorios que afecten a los requisitos legales básicos de la facturación electrónica obligatoria." Therefore™ no tiene capacidad autónoma de actualización regulatoria. Cambios legales específicos requieren desarrollo a medida o plataforma tercera.',
        spacing: { after: 300 }
      }),

      new Paragraph({
        children: [
          new TextRun({ text: '6. Riesgo regulatorio y penalizaciones', bold: true })
        ],
        spacing: { after: 100 }
      }),
      new Paragraph({
        text: 'Las penalizaciones se aplican sobre el TOTAL del servicio, cuando nuestra parte sería únicamente archivo/custodia (minoritaria dentro del alcance global). Service Credits hasta 100% factura mensual por incumplimientos SLA. Responsabilidad legal sobre cumplimiento regulatorio que NO controlamos (SEFE, formatos, interoperabilidad).',
        spacing: { after: 300 }
      }),

      new Paragraph({
        children: [
          new TextRun({ text: '7. Dependencias críticas del fabricante', bold: true })
        ],
        spacing: { after: 100 }
      }),
      new Paragraph({
        text: 'IT-STD corporativos, SIEM, SBOM por versión, SAST/SCA/DAST/pentest, mTLS, PAM, KMS/HSM, RGPD/DORA: TODO depende de evidencias que Canon/Therefore debe aportar. No hay go-live sin vulnerabilidades críticas/altas cerradas. No controlamos el roadmap de seguridad del fabricante ni los plazos de parcheo.',
        spacing: { after: 400 }
      }),

      // 5. OPCIONES DE RESPUESTA
      new Paragraph({
        text: '5. OPCIONES DE RESPUESTA',
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 }
      }),

      new Paragraph({
        text: 'OPCIÓN | QUÉ SUPONE | A FAVOR | EN CONTRA | VALORACIÓN',
        bold: true,
        spacing: { after: 100 }
      }),
      new Paragraph({
        text: '────────────────────────────────────────────────────────────',
        spacing: { after: 100 }
      }),

      new Paragraph({
        text: 'No presentarse | Declinar formalmente | Coherencia técnica, no quemar reputación en propuesta inviable | Oportunidad perdida si había malentendido del alcance | RECOMENDADO',
        spacing: { after: 200 }
      }),

      new Paragraph({
        text: 'Ir solos | Proponer Therefore™ como solución completa | - | 7 brechas bloqueantes, propuesta no cumple requisitos obligatorios | DESACONSEJADO',
        spacing: { after: 200 }
      }),

      new Paragraph({
        text: 'Ir con socio homologado (ej: Edicom, Pagero) | Socio cubre plataforma SEFE, nosotros archivo/custodia posterior | Cumplimiento normativo garantizado | Responsabilidad legal compartida, penalizaciones sobre total, margen reducido, dependencia tercero | RIESGO ALTO',
        spacing: { after: 200 }
      }),

      new Paragraph({
        text: 'Ofertar solo archivo/custodia (oferta parcial) | Proponer Therefore™ únicamente para almacenamiento final | Encaje real del producto | Pliego NO admite ofertas parciales explícitamente, probable descarte automático | INVIABLE',
        spacing: { after: 400 }
      }),

      new Paragraph({
        children: [
          new TextRun({ text: 'Valoración final: ', bold: true }),
          new TextRun({ text: 'Ir con socio homologado traslada el trabajo técnico pero NO la responsabilidad legal ni las penalizaciones. Canon respondería de un servicio que NO controla (interoperabilidad SEFE, portal masivo, actualización regulatoria). El margen comercial se reduce drásticamente al tener que repartir con el socio.' })
        ],
        spacing: { after: 400 }
      }),

      // 6. PRÓXIMOS PASOS
      new Paragraph({
        text: '6. PRÓXIMOS PASOS SI SE DECIDIERA DECLINAR',
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 }
      }),

      new Paragraph({
        text: '□ Comunicar declinación formal a VWFS antes del 20/11/2026',
        spacing: { after: 100 }
      }),
      new Paragraph({
        text: '□ Redactar carta de declinación con tono profesional (plantilla disponible)',
        spacing: { after: 100 }
      }),
      new Paragraph({
        text: '□ Ofrecer disponibilidad para proyectos futuros de DMS/archivo documental',
        spacing: { after: 100 }
      }),
      new Paragraph({
        text: '□ Mantener contacto comercial con VWFS para oportunidades alineadas con Therefore™',
        spacing: { after: 400 }
      }),

      new Paragraph({
        text: '7. PRÓXIMOS PASOS SI SE DECIDIERA PRESENTAR OFERTA CON SOCIO',
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 }
      }),

      new Paragraph({
        text: '□ Contactar socio homologado (Edicom, Pagero, otros) ANTES del 15/11/2026',
        spacing: { after: 100 }
      }),
      new Paragraph({
        text: '□ Definir alcance preciso: socio (SEFE, portal, firma) + nosotros (archivo/custodia)',
        spacing: { after: 100 }
      }),
      new Paragraph({
        text: '□ Negociar modelo de responsabilidad legal y penalizaciones',
        spacing: { after: 100 }
      }),
      new Paragraph({
        text: '□ Solicitar a Canon evidencias IT-STD, SBOM, SAST/SCA/DAST por versión',
        spacing: { after: 100 }
      }),
      new Paragraph({
        text: '□ Consultas a VWFS (antes 10/11): ¿Se admiten ofertas parciales? ¿UTE/subcontratación?',
        spacing: { after: 100 }
      }),
      new Paragraph({
        text: '□ Preparar matriz requisito-control-evidencia completa',
        spacing: { after: 100 }
      }),
      new Paragraph({
        text: '□ Propuesta económica conjunta con socio (oferta coordinada)',
        spacing: { after: 100 }
      }),
      new Paragraph({
        text: '□ Presentar oferta 20/11/2026',
        spacing: { after: 600 }
      }),

      // Footer
      new Paragraph({
        text: '_______________',
        alignment: AlignmentType.CENTER,
        spacing: { before: 400, after: 200 }
      }),
      new Paragraph({
        text: 'Documento generado automáticamente por TheJay - RFP Analyzer',
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 }
      }),
      new Paragraph({
        text: 'Basado en análisis del pliego VWFS Facturación Electrónica Ley Crea y Crece (nov 2026)',
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 }
      })
    ]
  }]
})

// Generar archivo
const outputPath = path.join(__dirname, '..', 'VWFS_Analisis_Completo.docx')

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync(outputPath, buffer)
  console.log(`✓ Análisis VWFS creado: ${outputPath}`)
})
