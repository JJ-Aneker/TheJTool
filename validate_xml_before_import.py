#!/usr/bin/env python3
"""
Validador de XML generado por Category Builder antes de importar a Therefore
Busca problemas comunes que causan error 2627 (PK violation)
"""

import xml.etree.ElementTree as ET
from collections import Counter
import sys

def validate_xml(filepath):
    print(f"📋 Validando: {filepath}\n")

    try:
        tree = ET.parse(filepath)
        root = tree.getroot()
    except ET.ParseError as e:
        print(f"❌ XML Parsing Error: {e}")
        return False

    issues = []

    # 1. Check GUIDs are unique
    all_guids = []
    for elem in root.iter('Id'):
        if elem.text:
            all_guids.append(elem.text)

    guid_counts = Counter(all_guids)
    duplicate_guids = {g: c for g, c in guid_counts.items() if c > 1}

    if duplicate_guids:
        issues.append(f"❌ GUIDs duplicados encontrados: {duplicate_guids}")
        for guid, count in duplicate_guids.items():
            print(f"   - {guid}: aparece {count} veces")
    else:
        print(f"✅ {len(all_guids)} GUIDs únicos (sin duplicados)")

    # 2. Check FieldNo are unique within categories
    for cat in root.findall('.//Category'):
        cat_name = cat.findtext('Name//S', 'Unknown')
        field_numbers = []

        for field in cat.findall('.//Field'):
            fieldno = field.findtext('FieldNo')
            if fieldno:
                field_numbers.append(int(fieldno))

        fn_counts = Counter(field_numbers)
        duplicate_fns = {f: c for f, c in fn_counts.items() if c > 1}

        if duplicate_fns:
            issues.append(f"❌ FieldNo duplicados en categoría '{cat_name}': {duplicate_fns}")
            print(f"   ❌ Categoría '{cat_name}' tiene FieldNo duplicados:")
            for fn, count in duplicate_fns.items():
                print(f"      - FieldNo {fn}: aparece {count} veces")
        else:
            print(f"   ✅ Categoría '{cat_name}': {len(field_numbers)} FieldNo únicos")

    # 3. Check BelongsToTable references exist
    print("\n📌 Validando referencias BelongsToTable:")
    for cat in root.findall('.//Category'):
        cat_name = cat.findtext('Name//S', 'Unknown')
        all_fieldnos = set()

        for field in cat.findall('.//Field'):
            fieldno = field.findtext('FieldNo')
            if fieldno:
                all_fieldnos.add(int(fieldno))

        belongs_refs = []
        for field in cat.findall('.//Field'):
            belongs = field.findtext('BelongsToTable')
            if belongs:
                belongs_refs.append(int(belongs))

        missing_refs = [b for b in belongs_refs if b not in all_fieldnos]
        if missing_refs:
            issues.append(f"❌ BelongsToTable references a FieldNo inexistente: {missing_refs}")
            print(f"   ❌ Categoría '{cat_name}' tiene referencias inválidas:")
            for ref in missing_refs:
                print(f"      - BelongsToTable {ref} no existe")
        else:
            print(f"   ✅ Categoría '{cat_name}': todas las referencias son válidas")

    # 4. Check TypeNo 10 fields have ForeignTable
    print("\n🗃️  Validando campos Tabla (TypeNo 10):")
    for cat in root.findall('.//Category'):
        cat_name = cat.findtext('Name//S', 'Unknown')
        table_fields = cat.findall(".//Field[TypeNo='10']")

        for tf in table_fields:
            caption = tf.findtext('Caption//S', 'Unknown')
            foreign = tf.findtext('ForeignTable')
            if not foreign:
                issues.append(f"❌ Campo tabla '{caption}' sin ForeignTable")
                print(f"   ❌ Campo tabla '{caption}' en '{cat_name}' sin ForeignTable")
            else:
                print(f"   ✅ Campo tabla '{caption}': ForeignTable={foreign}")

    # 5. Summary
    print("\n" + "="*60)
    if issues:
        print(f"❌ Se encontraron {len(issues)} problema(s):\n")
        for issue in issues:
            print(f"  {issue}")
        return False
    else:
        print("✅ XML válido - listo para importar a Therefore")
        print(f"\nResumen:")
        print(f"  - Total GUIDs: {len(all_guids)}")
        num_cats = len(root.findall('.//Category'))
        print(f"  - Categorías: {num_cats}")
        return True

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Uso: python validate_xml_before_import.py <archivo.xml>")
        sys.exit(1)

    success = validate_xml(sys.argv[1])
    sys.exit(0 if success else 1)
