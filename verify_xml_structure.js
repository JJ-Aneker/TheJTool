#!/usr/bin/env node
/**
 * Verify that generated XML has correct Therefore structure
 * Compares against reference patterns from TheConfigurationTEST.xml
 */

const fs = require('fs');
const path = require('path');

if (process.argv.length < 3) {
  console.error('Usage: node verify_xml_structure.js <xml_file>');
  process.exit(1);
}

const xmlFile = process.argv[2];
const xmlContent = fs.readFileSync(xmlFile, 'utf-8');

// Check for structural issues
const checks = [
  {
    name: 'No TableName in Category',
    test: () => !xmlContent.match(/<Category>.*?<TableName>/s),
    expected: true
  },
  {
    name: 'Has unique CtgryNo per category',
    test: () => {
      const ctgryNos = (xmlContent.match(/<CtgryNo>-\d+<\/CtgryNo>/g) || []).map(x =>
        parseInt(x.match(/-\d+/)[0])
      );
      const unique = new Set(ctgryNos);
      return unique.size === ctgryNos.length;
    },
    expected: true
  },
  {
    name: 'Category has Name with UPT="1"',
    test: () => xmlContent.includes('<Name UPT="1">'),
    expected: true
  },
  {
    name: 'Category has Version',
    test: () => xmlContent.match(/<Category>.*?<Version>/s),
    expected: true
  },
  {
    name: 'Category has Fields block',
    test: () => xmlContent.match(/<Fields>.*?<\/Fields>/s),
    expected: true
  },
  {
    name: 'Category has DataTypes (empty ok)',
    test: () => xmlContent.includes('<DataTypes></DataTypes>'),
    expected: true
  },
  {
    name: 'Category has Title',
    test: () => xmlContent.match(/<Title>.*?<\/Title>/),
    expected: true
  },
  {
    name: 'Category has Width and Height',
    test: () => xmlContent.includes('<Width>') && xmlContent.includes('<Height>'),
    expected: true
  },
  {
    name: 'Category has Watermark',
    test: () => xmlContent.includes('<Watermark>'),
    expected: true
  },
  {
    name: 'Category has FulltextMode',
    test: () => xmlContent.includes('<FulltextMode>1</FulltextMode>'),
    expected: true
  },
  {
    name: 'Category has CheckInMode',
    test: () => xmlContent.includes('<CheckInMode>'),
    expected: true
  },
  {
    name: 'Category has Description',
    test: () => xmlContent.includes('<Description UPT="1">'),
    expected: true
  },
  {
    name: 'Category has Header',
    test: () => xmlContent.includes('<Header>'),
    expected: true
  },
  {
    name: 'Category has Id (GUID)',
    test: () => xmlContent.match(/<Id>[A-F0-9\-]{36}<\/Id>/i),
    expected: true
  },
  {
    name: 'Category has DlgBgColor',
    test: () => xmlContent.includes('<DlgBgColor>'),
    expected: true
  },
  {
    name: 'Category has EmptyDocMode',
    test: () => xmlContent.includes('<EmptyDocMode>'),
    expected: true
  },
  {
    name: 'Category has CoverMode',
    test: () => xmlContent.includes('<CoverMode>'),
    expected: true
  },
  {
    name: 'Category has CtgryID',
    test: () => xmlContent.match(/<CtgryID>\w+<\/CtgryID>/),
    expected: true
  }
];

console.log('\n📋 XML Structure Validation:\n');

let passed = 0;
let failed = 0;

checks.forEach(check => {
  const result = check.test();
  const status = result === check.expected ? '✅' : '❌';

  if (result === check.expected) {
    passed++;
  } else {
    failed++;
  }

  console.log(`  ${status} ${check.name}`);
});

console.log('\n' + '='.repeat(50));
console.log(`✅ PASSED: ${passed}/${checks.length}`);
if (failed > 0) {
  console.log(`❌ FAILED: ${failed}/${checks.length}`);
  process.exit(1);
} else {
  console.log('🎉 All structure checks passed!');
}
console.log('='.repeat(50) + '\n');
