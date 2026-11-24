"""
generar_eform.py
================
Script reutilizable para crear nuevos eForms de Therefore a partir de
una plantilla XML exportada de forma nativa por el Solution Designer.

LECCIONES APRENDIDAS (tras 4 intentos fallidos):
-------------------------------------------------
❌ NO construir el XML desde cero — el parser SAX de Therefore es muy
   estricto y requiere una estructura exacta que solo se conoce exportando.
❌ NO escapar las comillas del JSON como &quot; — Therefore espera el JSON RAW.
❌ NO usar &lt; / &gt; en la estructura del JSON — solo en strings que
   contengan HTML (atributo "content" de componentes htmlelement).
❌ NO añadir <?xml version="1.0"?> — la plantilla nativa no lo lleva.
❌ NO añadir <Folders> ni FFold si la plantilla original no los tiene.
✅ SÍ usar json.dumps con indent=2 y \r\n (como genera Therefore).
✅ SÍ hacer reemplazos quirúrgicos: solo FName, FDef, DCrea, Id, FormID.
✅ SÍ mantener FCreUs y FCreUsNam del eForm original (son de la instancia).

USO:
----
1. Edita la sección "CONFIGURACIÓN" con los datos del nuevo eForm.
2. Edita la sección "COMPONENTES" con el form.io JSON de tu formulario.
3. Ejecuta: python generar_eform.py
4. Importa el XML generado en Therefore Solution Designer.
"""

import json
import re
import uuid
import datetime

# =============================================================================
# CONFIGURACIÓN — editar para cada nuevo eForm
# =============================================================================

PLANTILLA_XML   = "TheConfiguration_eformMatriculas_PLANTILLA.xml"
OUTPUT_XML      = "eform_nuevo.xml"
FORM_NAME       = "Nombre del Formulario"   # Visible en Therefore
FORM_ID         = "NombreFormularioSinEspacios"  # ID interno, sin espacios ni especiales

# =============================================================================
# COMPONENTES — definir el form.io JSON aquí
# Reglas para los valores de strings dentro del JSON:
#   - Caracteres normales: sin escaping
#   - Solo si el componente es "htmlelement" y tiene HTML en "content":
#       < → &lt;   > → &gt;   & → &amp;   " → \"   \ → \\   \n → \n
# =============================================================================

COMPONENTS = [
    # Ejemplo mínimo — reemplazar con los componentes reales
    {
        "label": "Panel principal",
        "type": "panel",
        "key": "panelPrincipal",
        "input": False,
        "tableView": False,
        "collapsible": False,
        "reorder": False,
        "properties": {},
        "customConditional": "",
        "logic": [],
        "attributes": {},
        "conditional": {"show": "", "when": "", "json": ""},
        "components": [
            {
                "label": "Campo de texto",
                "allowMultipleMasks": False,
                "showWordCount": False,
                "showCharCount": False,
                "tableView": True,
                "alwaysEnabled": False,
                "type": "textfield",
                "input": True,
                "key": "campoTexto",
                "inputFormat": "plain",
                "encrypted": False,
                "properties": {},
                "customConditional": "",
                "logic": [],
                "attributes": {},
                "reorder": False,
                "validate": {
                    "required": True,
                    "maxLength": 200,
                    "customMessage": "",
                    "json": ""
                },
                "conditional": {"show": "", "when": "", "json": ""}
            }
        ]
    },
    {
        "type": "button",
        "label": "Enviar",
        "key": "submit",
        "theme": "primary",
        "input": True,
        "tableView": True
    }
]

# =============================================================================
# HELPERS
# =============================================================================

def encode_html_for_content(html: str) -> str:
    """
    Codifica HTML para usarlo dentro del atributo 'content' de un
    componente htmlelement en el FDef de Therefore.
    SOLO usar en strings que contienen HTML — no en el JSON general.
    """
    html = html.replace('\\', '\\\\')
    html = html.replace('"', '\\"')
    html = html.replace('\n', '\\n')
    html = html.replace('&', '&amp;')
    html = html.replace('<', '&lt;')
    html = html.replace('>', '&gt;')
    return html


def make_column(width: int, key: str, components: list) -> dict:
    """Atajo para crear una columna estándar dentro de un 'columns'."""
    return {
        "width": width, "offset": 0, "push": 0, "pull": 0,
        "type": "column", "input": False, "hideOnChildrenHidden": False,
        "key": key, "tableView": True, "label": "Column",
        "components": components
    }


def make_textfield(label: str, key: str, required: bool = False,
                   max_length: int = 200, default: str = "") -> dict:
    """Atajo para crear un campo de texto estándar."""
    field = {
        "label": label,
        "allowMultipleMasks": False, "showWordCount": False, "showCharCount": False,
        "tableView": True, "alwaysEnabled": False,
        "type": "textfield", "input": True, "key": key,
        "inputFormat": "plain", "encrypted": False,
        "properties": {}, "customConditional": "", "logic": [], "attributes": {}, "reorder": False,
        "validate": {"required": required, "maxLength": max_length, "customMessage": "", "json": ""},
        "conditional": {"show": "", "when": "", "json": ""}
    }
    if default:
        field["defaultValue"] = default
    return field


def make_select(label: str, key: str, values: list,
                required: bool = False, default: str = "") -> dict:
    """
    Atajo para crear un select/dropdown.
    values: lista de dicts {"label": "...", "value": "..."}
    """
    field = {
        "label": label,
        "tableView": True, "alwaysEnabled": False,
        "type": "select", "input": True, "key": key,
        "reorder": False,
        "properties": {}, "customConditional": "", "logic": [], "attributes": {},
        "validate": {"required": required, "customMessage": "", "json": ""},
        "conditional": {"show": "", "when": "", "json": ""},
        "data": {"values": values}
    }
    if default:
        field["defaultValue"] = default
    return field


def make_datetime(label: str, key: str, required: bool = False) -> dict:
    """Atajo para crear un campo fecha (sin hora)."""
    return {
        "label": label,
        "tableView": True, "alwaysEnabled": False,
        "type": "datetime", "input": True, "key": key,
        "enableDate": True, "enableTime": False, "format": "dd/MM/yyyy",
        "reorder": False,
        "properties": {}, "customConditional": "", "logic": [], "attributes": {},
        "validate": {"required": required, "customMessage": "", "json": ""},
        "conditional": {"show": "", "when": "", "json": ""}
    }


def make_number(label: str, key: str, required: bool = False,
                min_val=None, max_val=None) -> dict:
    """Atajo para crear un campo numérico."""
    validate = {"required": required, "customMessage": "", "json": ""}
    if min_val is not None:
        validate["min"] = min_val
    if max_val is not None:
        validate["max"] = max_val
    return {
        "label": label,
        "tableView": True, "alwaysEnabled": False,
        "type": "number", "input": True, "key": key,
        "reorder": False,
        "properties": {}, "customConditional": "", "logic": [], "attributes": {},
        "validate": validate,
        "conditional": {"show": "", "when": "", "json": ""}
    }


# =============================================================================
# GENERADOR PRINCIPAL
# =============================================================================

def generate_eform(plantilla_path: str, output_path: str,
                   form_name: str, form_id: str, components: list):

    with open(plantilla_path, 'r', encoding='utf-8') as f:
        template = f.read()

    # Buscar FName original en la plantilla para el reemplazo
    fname_match = re.search(r'<FName>(.*?)</FName>', template)
    if not fname_match:
        raise ValueError("No se encontró <FName> en la plantilla")
    original_fname = fname_match.group(1)

    # Buscar FormID original
    formid_match = re.search(r'<FormID>(.*?)</FormID>', template)
    if not formid_match:
        raise ValueError("No se encontró <FormID> en la plantilla")
    original_formid = formid_match.group(1)

    # Buscar Id original del EForm (el que está después de </FFold> o antes de </EForm>)
    # Buscamos el Id que está dentro de <EForm>
    eform_block = re.search(r'<EForm>.*?</EForm>', template, re.DOTALL)
    if not eform_block:
        raise ValueError("No se encontró bloque <EForm> en la plantilla")
    id_match = re.search(r'<Id>([^<]+)</Id>', eform_block.group(0))
    if not id_match:
        raise ValueError("No se encontró <Id> dentro de <EForm>")
    original_id = id_match.group(1)

    # Construir el FDef: JSON indentado con \r\n (igual que Therefore)
    fdef = {
        "display": "form",
        "settings": {},
        "components": components
    }
    new_fdef = json.dumps(fdef, ensure_ascii=False, indent=2).replace('\n', '\r\n')

    # Timestamp actual
    now = datetime.datetime.now().strftime('%Y%m%d%H%M%S') + '000'

    # GUID nuevo único
    new_guid = str(uuid.uuid4()).upper()

    result = template

    # 1. Reemplazar FName
    result = result.replace(
        f'<FName>{original_fname}</FName>',
        f'<FName>{form_name}</FName>'
    )

    # 2. Reemplazar FDef (quirúrgico por índice para no confundir con otros <FDef>)
    fdef_start = result.index('<FDef>') + 6
    fdef_end   = result.index('</FDef>')
    result = result[:fdef_start] + new_fdef + result[fdef_end:]

    # 3. Reemplazar DCrea
    result = re.sub(r'<DCrea>\d+</DCrea>', f'<DCrea>{now}</DCrea>', result)

    # 4. Reemplazar Id del EForm
    result = result.replace(
        f'<Id>{original_id}</Id>',
        f'<Id>{new_guid}</Id>'
    )

    # 5. Reemplazar FormID
    result = result.replace(
        f'<FormID>{original_formid}</FormID>',
        f'<FormID>{form_id}</FormID>'
    )

    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(result)

    print(f"✅ eForm generado: {output_path}")
    print(f"   FName  : {form_name}")
    print(f"   FormID : {form_id}")
    print(f"   GUID   : {new_guid}")
    print(f"   DCrea  : {now}")


# =============================================================================
# PUNTO DE ENTRADA
# =============================================================================

if __name__ == "__main__":
    generate_eform(
        plantilla_path=PLANTILLA_XML,
        output_path=OUTPUT_XML,
        form_name=FORM_NAME,
        form_id=FORM_ID,
        components=COMPONENTS
    )
