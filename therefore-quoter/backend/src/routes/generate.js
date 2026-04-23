const { Document, Packer, Paragraph, Table, TableRow, TableCell, BorderStyle, VerticalAlign, AlignmentType, TextRun, HeadingLevel, ShadingType, PageBreak, convertInchesToTwip } = require('docx');

module.exports = (db) => {
  const express = require('express');
  const router = express.Router();

  const COLORS = {
    redCanon: 'C00000',
    textDark: '000000',
    greyMedium: '7F7F7F',
    greyLight: 'F2F2F2',
    borderGrey: 'CCCCCC',
    white: 'FFFFFF'
  };

  function createBorder(color = COLORS.borderGrey, size = 4) {
    return {
      top: { style: BorderStyle.SINGLE, size, color },
      bottom: { style: BorderStyle.SINGLE, size, color },
      left: { style: BorderStyle.SINGLE, size, color },
      right: { style: BorderStyle.SINGLE, size, color },
      insideHorizontal: { style: BorderStyle.SINGLE, size, color },
      insideVertical: { style: BorderStyle.SINGLE, size, color }
    };
  }

  function TC(text, bold = false, size = 16, color = COLORS.textDark) {
    return new TextRun({
      text,
      bold,
      size,
      color,
      font: 'Montserrat'
    });
  }

  function RH1(text) {
    return new Paragraph({
      children: [
        new TextRun({
          text: text.charAt(0).toUpperCase() + text.slice(1).toLowerCase(),
          bold: true,
          size: 52,
          color: COLORS.redCanon,
          font: 'Tungsten Reveal EXT'
        })
      ],
      spacing: { after: 400 },
      alignment: AlignmentType.LEFT
    });
  }

  function RH2(text) {
    return new Paragraph({
      children: [
        new TextRun({
          text: text.charAt(0).toUpperCase() + text.slice(1).toLowerCase(),
          bold: true,
          size: 36,
          color: COLORS.redCanon,
          font: 'Tungsten Reveal EXT'
        })
      ],
      spacing: { after: 200 },
      alignment: AlignmentType.LEFT
    });
  }

  function TB(text, align = AlignmentType.LEFT) {
    return new Paragraph({
      children: [TC(text, false, 16, COLORS.textDark)],
      spacing: { after: 200 },
      alignment: align
    });
  }

  function createHeaderCell(text) {
    return new TableCell({
      children: [
        new Paragraph({
          children: [TC(text, true, 14, COLORS.white)],
          alignment: AlignmentType.CENTER
        })
      ],
      shading: { type: ShadingType.CLEAR, fill: COLORS.redCanon },
      verticalAlign: VerticalAlign.CENTER,
      borders: createBorder(COLORS.borderGrey, 4)
    });
  }

  function createBodyCell(text, shade = false) {
    return new TableCell({
      children: [
        new Paragraph({
          children: [TC(text, false, 14, COLORS.textDark)],
          alignment: AlignmentType.LEFT
        })
      ],
      shading: { type: ShadingType.CLEAR, fill: shade ? COLORS.greyLight : COLORS.white },
      verticalAlign: VerticalAlign.CENTER,
      borders: createBorder(COLORS.borderGrey, 4)
    });
  }

  router.post('/', async (req, res) => {
    try {
      const { cliente, tipo, plataforma, titulo, objeto, bloques, exclusiones, supuestos, referencia, tarifa, fecha } = req.body;

      if (!cliente || !bloques) {
        return res.status(400).json({ error: 'Faltan datos requeridos' });
      }

      const tar = tarifa || 800;
      const fec = fecha || new Date().toLocaleDateString('es-ES');

      // Calculate totals
      let totalDias = 0;
      let totalImporte = 0;
      bloques.forEach(b => {
        b.tareas.forEach(t => {
          totalDias += t.dias || 0;
          totalImporte += (t.dias || 0) * tar;
        });
      });

      const sections = [
        {
          children: [
            // PORTADA
            new Paragraph({ text: '', spacing: { after: 1000 } }),
            new Paragraph({
              children: [new TextRun({ text: 'Therefore™ Online', size: 32, bold: true, font: 'Tungsten Reveal EXT', color: COLORS.redCanon })],
              alignment: AlignmentType.CENTER,
              spacing: { after: 200 }
            }),
            new Paragraph({
              children: [new TextRun({ text: '─'.repeat(40), size: 24, color: COLORS.redCanon })],
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 }
            }),
            new Paragraph({
              children: [new TextRun({ text: titulo || 'Propuesta Técnica', size: 48, bold: true, color: COLORS.textDark, font: 'Tungsten Reveal EXT' })],
              alignment: AlignmentType.CENTER,
              spacing: { after: 200 }
            }),
            new Paragraph({
              children: [new TextRun({ text: objeto || 'Estimación de esfuerzo', size: 24, color: COLORS.greyMedium })],
              alignment: AlignmentType.CENTER,
              spacing: { after: 800 }
            }),
            new Paragraph({
              children: [new TextRun({ text: cliente, size: 28, bold: true, color: COLORS.redCanon, font: 'Tungsten Reveal EXT' })],
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 }
            }),
            new Paragraph({
              children: [new TextRun({ text: `${fec} · v1.0`, size: 20, color: COLORS.greyMedium })],
              alignment: AlignmentType.CENTER,
              spacing: { after: 2000 }
            }),

            // PAGE BREAK
            new Paragraph({
              text: '',
              pageBreakBefore: true,
              spacing: { after: 400 }
            }),

            // FICHA DE DOCUMENTO
            RH2('Ficha del Documento'),
            createDocumentSheet(cliente, titulo, referencia, fec, tipo),
            new Paragraph({ text: '', spacing: { after: 600 } }),

            // HISTORIAL VERSIONES
            RH2('Historial de Versiones'),
            createVersionHistory(fec),
            new Paragraph({ text: '', spacing: { after: 600 } }),

            // CONFIDENCIALIDAD
            RH2('Confidencialidad'),
            TB('Este documento contiene información confidencial de Canon España, S.A.U.'),
            new Paragraph({ text: '', spacing: { after: 600 } }),

            // OBJETO Y CONTEXTO
            RH2('Objeto y Contexto'),
            TB(objeto || 'Especificación de esfuerzo para implantación Therefore™'),
            new Paragraph({ text: '', spacing: { after: 600 } }),

            // LICENCIAS (si tipo === 'nuevo')
            ...(tipo === 'nuevo' ? [
              RH2('Licencias Therefore™'),
              TB('Se incluyen licencias base: Cases, Workflow Designer, eForm Designer'),
              new Paragraph({ text: '', spacing: { after: 600 } })
            ] : []),

            // DETALLE DE ESFUERZO
            RH2('Detalle de Esfuerzo'),
            ...createEffortTables(bloques, tar),
            new Paragraph({ text: '', spacing: { after: 600 } }),

            // ESTIMACIÓN ECONÓMICA
            RH2('Estimación Económica'),
            createEconomicSummary(totalDias, tar, totalImporte),
            new Paragraph({ text: '', spacing: { after: 600 } }),

            // HITOS
            RH2('Hitos de Facturación'),
            createMilestones(totalImporte),
            new Paragraph({ text: '', spacing: { after: 600 } }),

            // SUPUESTOS
            RH2('Supuestos y Condiciones'),
            ...(supuestos && supuestos.length > 0
              ? supuestos.map((s, i) => TB(`${i + 1}. ${s}`))
              : [TB('1. Proyecto sujeto a cambios de alcance'), TB('2. Tarifa de consultoría: €' + tar + '/día')]),
            new Paragraph({ text: '', spacing: { after: 600 } }),

            // EXCLUSIONES
            ...(exclusiones && exclusiones.length > 0 ? [
              RH2('Alcance Excluido'),
              ...exclusiones.map(e => TB(`• ${e}`)),
              new Paragraph({ text: '', spacing: { after: 600 } })
            ] : []),

            // FIRMAS
            new Paragraph({ text: '', spacing: { after: 800 } }),
            RH2('Firmas y Aceptación'),
            TB('Acepta el cliente:'),
            TB('_________________________________     Fecha: __________'),
            new Paragraph({ text: '', spacing: { after: 200 } }),
            TB('Aprueba Canon / Aneker:'),
            TB('_________________________________     Fecha: __________')
          ]
        }
      ];

      const doc = new Document({ sections });
      const buffer = await Packer.toBuffer(doc);

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename="COTIZACION_${cliente.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.docx"`);
      res.send(buffer);

    } catch (error) {
      console.error('Generate error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  function createDocumentSheet(cliente, titulo, ref, fecha, tipo) {
    return new Table({
      rows: [
        new TableRow({
          children: [
            createBodyCell('Título', false),
            createBodyCell(titulo || 'Propuesta', false)
          ]
        }),
        new TableRow({
          children: [
            createBodyCell('Versión', true),
            createBodyCell('1.0', true)
          ]
        }),
        new TableRow({
          children: [
            createBodyCell('Fecha', false),
            createBodyCell(fecha, false)
          ]
        }),
        new TableRow({
          children: [
            createBodyCell('Cliente', true),
            createBodyCell(cliente, true)
          ]
        }),
        new TableRow({
          children: [
            createBodyCell('Tipo', false),
            createBodyCell(tipo === 'nuevo' ? 'Nuevo' : 'Evolutivo', false)
          ]
        }),
        ...(ref ? [new TableRow({
          children: [
            createBodyCell('Referencia', true),
            createBodyCell(ref, true)
          ]
        })] : [])
      ],
      borders: createBorder(),
      width: { size: 100, type: 'pct' }
    });
  }

  function createVersionHistory(fecha) {
    return new Table({
      rows: [
        new TableRow({
          children: [
            createHeaderCell('Versión'),
            createHeaderCell('Fecha'),
            createHeaderCell('Autor'),
            createHeaderCell('Cambios')
          ]
        }),
        new TableRow({
          children: [
            createBodyCell('1.0', false),
            createBodyCell(fecha, false),
            createBodyCell('Aneker', false),
            createBodyCell('Versión inicial', false)
          ]
        })
      ],
      borders: createBorder(),
      width: { size: 100, type: 'pct' }
    });
  }

  function createEffortTables(bloques, tarifa) {
    const results = [];

    bloques.forEach((bloque, idx) => {
      const rows = [
        new TableRow({
          children: [
            createHeaderCell('Tarea'),
            createHeaderCell('Perfil'),
            createHeaderCell('Días'),
            createHeaderCell('Horas'),
            createHeaderCell('€')
          ]
        })
      ];

      bloque.tareas.forEach((tarea, tIdx) => {
        const importe = (tarea.dias || 0) * tarifa;
        rows.push(
          new TableRow({
            children: [
              createBodyCell(tarea.desc || tarea.label, tIdx % 2 === 1),
              createBodyCell(tarea.perfil, tIdx % 2 === 1),
              createBodyCell(String(tarea.dias || 0), tIdx % 2 === 1),
              createBodyCell(String(tarea.horas || 0), tIdx % 2 === 1),
              createBodyCell('€' + importe.toFixed(2), tIdx % 2 === 1)
            ]
          })
        );
      });

      results.push(
        new Paragraph({
          children: [new TextRun({ text: bloque.grupo || bloque.label, bold: true, size: 28, color: COLORS.textDark, font: 'Montserrat' })],
          spacing: { after: 200 }
        }),
        new Table({
          rows,
          borders: createBorder(),
          width: { size: 100, type: 'pct' }
        }),
        new Paragraph({ text: '', spacing: { after: 400 } })
      );
    });

    return results;
  }

  function createEconomicSummary(totalDias, tarifa, totalImporte) {
    return new Table({
      rows: [
        new TableRow({
          children: [
            createHeaderCell('Concepto'),
            createHeaderCell('Días'),
            createHeaderCell('Tarifa'),
            createHeaderCell('Importe')
          ]
        }),
        new TableRow({
          children: [
            createBodyCell('Servicios Therefore™', false),
            createBodyCell(String(totalDias.toFixed(1)), false),
            createBodyCell('€' + tarifa + '/día', false),
            createBodyCell('€' + totalImporte.toFixed(2), false)
          ]
        }),
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({
                children: [TC('TOTAL', true, 28, COLORS.white)],
                alignment: AlignmentType.LEFT
              })],
              shading: { type: ShadingType.CLEAR, fill: COLORS.redCanon },
              borders: createBorder(COLORS.borderGrey, 4)
            }),
            new TableCell({
              children: [new Paragraph({
                children: [TC(String(totalDias.toFixed(1)), true, 28, COLORS.white)],
                alignment: AlignmentType.CENTER
              })],
              shading: { type: ShadingType.CLEAR, fill: COLORS.redCanon },
              borders: createBorder(COLORS.borderGrey, 4)
            }),
            new TableCell({
              children: [new Paragraph({
                children: [TC('€' + tarifa, true, 28, COLORS.white)],
                alignment: AlignmentType.CENTER
              })],
              shading: { type: ShadingType.CLEAR, fill: COLORS.redCanon },
              borders: createBorder(COLORS.borderGrey, 4)
            }),
            new TableCell({
              children: [new Paragraph({
                children: [TC('€' + totalImporte.toFixed(2), true, 28, COLORS.white)],
                alignment: AlignmentType.RIGHT
              })],
              shading: { type: ShadingType.CLEAR, fill: COLORS.redCanon },
              borders: createBorder(COLORS.borderGrey, 4)
            })
          ]
        })
      ],
      borders: createBorder(),
      width: { size: 100, type: 'pct' }
    });
  }

  function createMilestones(total) {
    const m1 = (total * 0.5).toFixed(2);
    const m2 = (total * 0.5).toFixed(2);

    return new Table({
      rows: [
        new TableRow({
          children: [
            createHeaderCell('Hito'),
            createHeaderCell('Descripción'),
            createHeaderCell('%'),
            createHeaderCell('Importe')
          ]
        }),
        new TableRow({
          children: [
            createBodyCell('Hito 1', false),
            createBodyCell('Firma contrato', false),
            createBodyCell('50%', false),
            createBodyCell('€' + m1, false)
          ]
        }),
        new TableRow({
          children: [
            createBodyCell('Hito 2', true),
            createBodyCell('UAT completado', true),
            createBodyCell('50%', true),
            createBodyCell('€' + m2, true)
          ]
        })
      ],
      borders: createBorder(),
      width: { size: 100, type: 'pct' }
    });
  }

  return router;
};
