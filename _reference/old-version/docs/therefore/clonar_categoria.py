"""
clonar_categoria.py
===================
Clona una categoría exportada de Therefore cambiando nombre, CtgryID y GUIDs.
Uso típico: replicar una categoría base en varias con diferente nombre.

LECCIONES APRENDIDAS (analizando TheConfiguration_categoria.xml):
------------------------------------------------------------------
Una categoría exportada tiene exactamente 4 elementos que deben cambiar
para crear una copia independiente en la misma instancia:

  1. <Name>    — nombre visible en el Solution Designer
  2. <Title>   — título mostrado en el Web Client
  3. <CtgryID> — identificador interno (sin espacios, sin tildes)
  4. <Id> de la categoría — GUID único de la categoría
  5. <Id> de cada <Field> — 116 GUIDs (uno por campo)
  6. <Id> de cada <Counter> — GUIDs de los contadores
  7. <Id> de cada <Template> — GUIDs de las plantillas de imagen

Lo que NO se cambia:
  - <CtgryNo>  — Therefore lo reasigna al importar (negativo = placeholder)
  - <FieldNo>  — Therefore los reasigna al importar
  - <BelongsTo>, <ForeignCol>, <Links> — relaciones internas entre campos
  - <WorkflowProcessNo>, <FolderNo> — se reapuntan al importar
  - <CounterNo> — Therefore lo reasigna

USO:
----
  python clonar_categoria.py

O como módulo:
  from clonar_categoria import clonar_categoria
  clonar_categoria(
      origen='TheConfiguration_categoria.xml',
      destino='TheConfiguration_categoria_nueva.xml',
      nuevo_nombre='02 - Legal y Fiscal',
      nuevo_ctgry_id='Legal_Fiscal'
  )
"""

import re
import uuid
from pathlib import Path


def _nuevo_guid() -> str:
    return str(uuid.uuid4()).upper()


def clonar_categoria(
    origen: str,
    destino: str,
    nuevo_nombre: str,
    nuevo_ctgry_id: str,
    nuevo_titulo: str = None
) -> dict:
    """
    Clona una categoría exportada de Therefore.

    Args:
        origen:        Ruta al XML exportado por Solution Designer.
        destino:       Ruta del XML de salida para importar.
        nuevo_nombre:  Nombre visible (puede contener tildes y espacios).
                       Ejemplo: '02 - Legal y Fiscal'
        nuevo_ctgry_id: Identificador interno, sin espacios ni tildes.
                        Ejemplo: 'Legal_Fiscal'
        nuevo_titulo:  Título en Web Client. Si None, usa nuevo_nombre.

    Returns:
        dict con estadísticas del proceso.
    """
    if nuevo_titulo is None:
        nuevo_titulo = nuevo_nombre

    with open(origen, 'r', encoding='utf-8') as f:
        xml = f.read()

    stats = {
        'campos_actualizados': 0,
        'counters_actualizados': 0,
        'templates_actualizados': 0,
        'guid_categoria': None,
    }

    # =========================================================================
    # 1. Nombre visible (<Name UPT="1">)
    # =========================================================================
    nombre_orig = re.search(
        r'<Name UPT="1"><TStr><T><L>1034</L><S>([^<]+)</S>',
        xml
    )
    if nombre_orig:
        xml = xml.replace(
            f'<Name UPT="1"><TStr><T><L>1034</L><S>{nombre_orig.group(1)}</S>',
            f'<Name UPT="1"><TStr><T><L>1034</L><S>{nuevo_nombre}</S>'
        )

    # =========================================================================
    # 2. Título (<Title>)
    # =========================================================================
    titulo_orig = re.search(r'<Title>([^<]+)</Title>', xml)
    if titulo_orig:
        xml = xml.replace(
            f'<Title>{titulo_orig.group(1)}</Title>',
            f'<Title>{nuevo_titulo}</Title>'
        )

    # =========================================================================
    # 3. CtgryID
    # =========================================================================
    ctgry_orig = re.search(r'<CtgryID>([^<]+)</CtgryID>', xml)
    if ctgry_orig:
        xml = xml.replace(
            f'<CtgryID>{ctgry_orig.group(1)}</CtgryID>',
            f'<CtgryID>{nuevo_ctgry_id}</CtgryID>'
        )

    # =========================================================================
    # 4. GUID de la categoría
    #    Es el único <Id> que queda en el bloque <Category> después de quitar
    #    los <Field>, <Counter> y <Template>.
    #    Estrategia: el GUID de la categoría está fuera de cualquier sub-bloque.
    #    Lo identificamos porque aparece una sola vez entre </DocTitles> y </Category>
    #    (o lo buscamos eliminando los bloques anidados).
    # =========================================================================
    cat_guid_match = re.search(
        r'<DlgBgColor>[^<]+</DlgBgColor>.*?<DocTitles>.*?</DocTitles>'
        r'<CtgryID>[^<]+</CtgryID>',
        xml, re.DOTALL
    )
    # Buscar el Id que está fuera de Field/Counter/Template
    # Construimos una versión sin subbloques para localizarlo
    xml_sin_sub = re.sub(r'<Field>.*?</Field>', '<FIELD_PLACEHOLDER/>', xml, flags=re.DOTALL)
    xml_sin_sub = re.sub(r'<Counter>.*?</Counter>', '<COUNTER_PLACEHOLDER/>', xml_sin_sub, flags=re.DOTALL)
    xml_sin_sub = re.sub(r'<Template>.*?</Template>', '<TEMPLATE_PLACEHOLDER/>', xml_sin_sub, flags=re.DOTALL)

    # Ahora en xml_sin_sub el único <Id> dentro de <Category> es el de la categoría
    cat_id_in_stripped = re.search(
        r'<Category>.*?<Id>([^<]+)</Id>.*?</Category>',
        xml_sin_sub, re.DOTALL
    )
    if cat_id_in_stripped:
        guid_cat_orig = cat_id_in_stripped.group(1)
        nuevo_guid_cat = _nuevo_guid()
        # Reemplazar SOLO esa ocurrencia en el xml original
        # Usamos un reemplazo de la primera ocurrencia en el bloque correcto
        xml = xml.replace(f'<Id>{guid_cat_orig}</Id>', f'<Id>{nuevo_guid_cat}</Id>', 1)
        stats['guid_categoria'] = nuevo_guid_cat

    # =========================================================================
    # 5. GUIDs de cada <Field>
    # =========================================================================
    def reemplazar_guid_en_bloque(match):
        bloque = match.group(0)
        bloque = re.sub(r'<Id>[^<]+</Id>', f'<Id>{_nuevo_guid()}</Id>', bloque, count=1)
        stats['campos_actualizados'] += 1
        return bloque

    xml = re.sub(r'<Field>.*?</Field>', reemplazar_guid_en_bloque, xml, flags=re.DOTALL)

    # =========================================================================
    # 6. GUIDs de cada <Counter>
    # =========================================================================
    def reemplazar_guid_counter(match):
        bloque = match.group(0)
        bloque = re.sub(r'<Id>[^<]+</Id>', f'<Id>{_nuevo_guid()}</Id>', bloque, count=1)
        # Resetear el contador a 1 para la nueva categoría
        bloque = re.sub(r'<Next>\d+</Next>', '<Next>1</Next>', bloque)
        stats['counters_actualizados'] += 1
        return bloque

    xml = re.sub(r'<Counter>.*?</Counter>', reemplazar_guid_counter, xml, flags=re.DOTALL)

    # =========================================================================
    # 7. GUIDs de cada <Template> (logos, imágenes de cabecera)
    # =========================================================================
    def reemplazar_guid_template(match):
        bloque = match.group(0)
        bloque = re.sub(r'<Id>[^<]+</Id>', f'<Id>{_nuevo_guid()}</Id>', bloque, count=1)
        stats['templates_actualizados'] += 1
        return bloque

    xml = re.sub(r'<Template>.*?</Template>', reemplazar_guid_template, xml, flags=re.DOTALL)

    # =========================================================================
    # Escribir resultado
    # =========================================================================
    with open(destino, 'w', encoding='utf-8') as f:
        f.write(xml)

    print(f"✅ Categoría clonada: {destino}")
    print(f"   Nombre    : {nuevo_nombre}")
    print(f"   CtgryID   : {nuevo_ctgry_id}")
    print(f"   GUID cat  : {stats['guid_categoria']}")
    print(f"   Campos    : {stats['campos_actualizados']}")
    print(f"   Counters  : {stats['counters_actualizados']}")
    print(f"   Templates : {stats['templates_actualizados']}")
    return stats


def clonar_en_lote(origen: str, clones: list) -> None:
    """
    Genera múltiples clones de una misma categoría base.

    Args:
        origen: Ruta al XML exportado.
        clones: Lista de dicts con keys: destino, nuevo_nombre, nuevo_ctgry_id,
                y opcionalmente nuevo_titulo.

    Ejemplo:
        clonar_en_lote('TheConfiguration_categoria.xml', [
            {'destino': 'cat_legal.xml',
             'nuevo_nombre': '02 - Legal y Fiscal',
             'nuevo_ctgry_id': 'Legal_Fiscal'},
            {'destino': 'cat_personas.xml',
             'nuevo_nombre': '03 - Personas',
             'nuevo_ctgry_id': 'Personas'},
        ])
    """
    for i, clone in enumerate(clones, 1):
        print(f"\n[{i}/{len(clones)}] Clonando → {clone['destino']}")
        clonar_categoria(
            origen=origen,
            destino=clone['destino'],
            nuevo_nombre=clone['nuevo_nombre'],
            nuevo_ctgry_id=clone['nuevo_ctgry_id'],
            nuevo_titulo=clone.get('nuevo_titulo')
        )
    print(f"\n✅ Lote completado: {len(clones)} categorías generadas.")


# =============================================================================
# PUNTO DE ENTRADA — editar aquí para uso directo
# =============================================================================
if __name__ == '__main__':

    # Ejemplo: clonar una sola categoría
    clonar_categoria(
        origen='TheConfiguration_categoria_PLANTILLA.xml',
        destino='TheConfiguration_categoria_nueva.xml',
        nuevo_nombre='02 - Legal y Fiscal',
        nuevo_ctgry_id='Legal_Fiscal'
    )

    # Ejemplo: clonar en lote (descomentar para usar)
    # clonar_en_lote(
    #     origen='TheConfiguration_categoria_PLANTILLA.xml',
    #     clones=[
    #         {'destino': 'cat_02_legal.xml',
    #          'nuevo_nombre': '02 - Legal y Fiscal',
    #          'nuevo_ctgry_id': 'Legal_Fiscal'},
    #         {'destino': 'cat_03_personas.xml',
    #          'nuevo_nombre': '03 - Personas',
    #          'nuevo_ctgry_id': 'Personas'},
    #         {'destino': 'cat_04_servicios.xml',
    #          'nuevo_nombre': '04 - Servicios Generales',
    #          'nuevo_ctgry_id': 'Servicios_Generales'},
    #     ]
    # )
