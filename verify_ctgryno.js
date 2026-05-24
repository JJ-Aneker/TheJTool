#!/usr/bin/env node
/**
 * Verify that all categories in XML have unique CtgryNo values
 * Usage: node verify_ctgryno.js <xml_file>
 */

const fs = require('fs');
const path = require('path');

if (process.argv.length < 3) {
  console.error('Usage: node verify_ctgryno.js <xml_file>');
  process.exit(1);
}

const xmlFile = process.argv[2];
const xmlContent = fs.readFileSync(xmlFile, 'utf-8');

// Extract all <Category>...</Category> blocks
const categoryRegex = /<Category>[\s\S]*?<\/Category>/g;
const categories = xmlContent.match(categoryRegex) || [];

console.log(`\n📊 Found ${categories.length} categories in XML\n`);

const ctgryInfo = categories.map((catXml, idx) => {
  const ctgryNoMatch = catXml.match(/<CtgryNo>(-?\d+)<\/CtgryNo>/);
  const nameMatch = catXml.match(/<Title>(.*?)<\/Title>/);

  const ctgryNo = ctgryNoMatch ? parseInt(ctgryNoMatch[1]) : 'NOT FOUND';
  const title = nameMatch ? nameMatch[1] : 'UNKNOWN';

  return { index: idx, ctgryNo, title };
});

// Check for uniqueness
const ctgryNos = ctgryInfo.map(c => c.ctgryNo).filter(n => n !== 'NOT FOUND');
const uniqueCtgryNos = new Set(ctgryNos);

console.log('Category Details:');
ctgryInfo.forEach(c => {
  const status = c.ctgryNo === 'NOT FOUND' ? '❌' : '✅';
  console.log(`  ${status} Category ${c.index}: CtgryNo=${c.ctgryNo}, Title="${c.title}"`);
});

console.log('\n' + '='.repeat(60));
if (uniqueCtgryNos.size === ctgryNos.length && ctgryNos.length === categories.length) {
  console.log(`✅ SUCCESS: All ${categories.length} categories have UNIQUE CtgryNo values!`);
  console.log(`   CtgryNo values: ${Array.from(uniqueCtgryNos).sort((a,b) => a-b).join(', ')}`);
} else {
  console.log(`❌ FAILURE: Categories have DUPLICATE CtgryNo values!`);
  console.log(`   Found ${uniqueCtgryNos.size} unique values for ${ctgryNos.length} categories`);
}
console.log('='.repeat(60) + '\n');
