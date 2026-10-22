/**
 * eformXml.test.js
 * Tests unitarios para el generador de XML de eForms
 *
 * Ejecutar con: node tests/eformXml.test.js
 */

import { buildEformXml, getDefaultTemplate } from '../api/_lib/eformXml.js'
import assert from 'assert'

console.log('🧪 Ejecutando tests del generador eForm XML...\n')

// Test 1: Con plantilla por defecto, el XML contiene exactamente un <EForm>
function test1() {
  console.log('Test 1: XML contiene exactamente un <EForm>')

  const components = [
    {
      type: 'textfield',
      key: 'nombre',
      label: 'Nombre',
      input: true,
      validate: { required: true }
    },
    {
      type: 'button',
      key: 'submit',
      label: 'Enviar',
      theme: 'primary',
      input: true
    }
  ]

  const xml = buildEformXml({
    formName: 'Test Form',
    formId: 'TestForm',
    components
  })

  const eformMatches = xml.match(/<EForm>/g)
  assert.strictEqual(eformMatches.length, 1, 'Debe haber exactamente un <EForm>')

  console.log('✅ Test 1 pasado\n')
}

// Test 2: El FDef des-escapado parsea con JSON.parse
function test2() {
  console.log('Test 2: FDef des-escapado parsea correctamente')

  const components = [
    {
      type: 'panel',
      key: 'panel1',
      label: 'Panel de prueba',
      components: [
        {
          type: 'textfield',
          key: 'campo1',
          label: 'Campo 1',
          input: true
        }
      ]
    },
    {
      type: 'button',
      key: 'submit',
      label: 'Enviar',
      input: true
    }
  ]

  const xml = buildEformXml({
    formName: 'Test Form 2',
    formId: 'TestForm2',
    components
  })

  // Extraer FDef
  const fdefMatch = xml.match(/<FDef>(.+?)<\/FDef>/s)
  assert.ok(fdefMatch, 'Debe existir tag <FDef>')

  let fdef = fdefMatch[1]

  // Des-escapar XML
  fdef = fdef.replace(/&lt;/g, '<')
  fdef = fdef.replace(/&gt;/g, '>')
  fdef = fdef.replace(/&amp;/g, '&')
  fdef = fdef.replace(/\r\n/g, '\n')

  // Parsear JSON
  let parsed
  try {
    parsed = JSON.parse(fdef)
  } catch (err) {
    assert.fail(`FDef no es JSON válido: ${err.message}`)
  }

  assert.strictEqual(parsed.display, 'form', 'Debe tener display: form')
  assert.ok(Array.isArray(parsed.components), 'Debe tener array de components')
  assert.strictEqual(parsed.components.length, 2, 'Debe tener 2 componentes')

  console.log('✅ Test 2 pasado\n')
}

// Test 3: htmlelement con onclick acaba como &lt;...&gt; en el XML
function test3() {
  console.log('Test 3: HTML en htmlelement se escapa correctamente')

  const components = [
    {
      type: 'htmlelement',
      key: 'html1',
      tag: 'div',
      content: "<div onclick='window.doSomething()'>Botón</div>"
    },
    {
      type: 'button',
      key: 'submit',
      label: 'Enviar',
      input: true
    }
  ]

  const xml = buildEformXml({
    formName: 'Test HTML',
    formId: 'TestHTML',
    components
  })

  // El XML debe contener &lt;div onclick= (escapado)
  assert.ok(xml.includes('&lt;div onclick='), 'HTML debe estar escapado con &lt;')
  assert.ok(xml.includes('&gt;'), 'HTML debe estar escapado con &gt;')

  // No debe contener <div onclick= sin escapar en el FDef
  const fdefMatch = xml.match(/<FDef>(.+?)<\/FDef>/s)
  const fdef = fdefMatch[1]

  // El FDef NO debe tener <div sin escapar (solo &lt;div)
  assert.ok(!fdef.includes('<div onclick='), 'No debe haber HTML sin escapar en FDef')

  console.log('✅ Test 3 pasado\n')
}

// Test 4: FCreUs y FCreUsNam de la plantilla se conservan
function test4() {
  console.log('Test 4: Metadatos de plantilla se conservan')

  const components = [
    { type: 'textfield', key: 'test', label: 'Test', input: true },
    { type: 'button', key: 'submit', label: 'Enviar', input: true }
  ]

  const xml = buildEformXml({
    formName: 'Test Metadata',
    formId: 'TestMetadata',
    components
  })

  // La plantilla por defecto tiene FCreUs=4 y FCreUsNam=JJ
  assert.ok(xml.includes('<FCreUs>4</FCreUs>'), 'Debe conservar FCreUs original')
  assert.ok(xml.includes('<FCreUsNam>JJ</FCreUsNam>'), 'Debe conservar FCreUsNam original')

  console.log('✅ Test 4 pasado\n')
}

// Test 5: Fuera del bloque <EForm> el fichero es idéntico a la plantilla
function test5() {
  console.log('Test 5: Contenido fuera de <EForm> no cambia')

  const template = getDefaultTemplate()

  const components = [
    { type: 'textfield', key: 'x', label: 'X', input: true },
    { type: 'button', key: 'submit', label: 'Enviar', input: true }
  ]

  const xml = buildEformXml({
    formName: 'Test Unchanged',
    formId: 'TestUnchanged',
    components
  })

  // Extraer contenido antes de <EForms>
  const beforeEForms = xml.split('<EForms>')[0]
  const templateBeforeEForms = template.split('<EForms>')[0]

  assert.strictEqual(beforeEForms, templateBeforeEForms,
    'Contenido antes de <EForms> debe ser idéntico')

  // Extraer contenido después de </EForm>
  const afterEForm = xml.split('</EForm>')[1]
  const templateAfterEForm = template.split('</EForm>')[1]

  assert.strictEqual(afterEForm, templateAfterEForm,
    'Contenido después de </EForm> debe ser idéntico')

  console.log('✅ Test 5 pasado\n')
}

// Test 6: FormName y FormID se reemplazan correctamente
function test6() {
  console.log('Test 6: FormName y FormID se reemplazan')

  const components = [
    { type: 'button', key: 'submit', label: 'Enviar', input: true }
  ]

  const xml = buildEformXml({
    formName: 'Mi Formulario de Prueba',
    formId: 'MiFormularioPrueba',
    components
  })

  assert.ok(xml.includes('<FName>Mi Formulario de Prueba</FName>'),
    'FName debe ser el proporcionado')
  assert.ok(xml.includes('<FormID>MiFormularioPrueba</FormID>'),
    'FormID debe ser el proporcionado')

  // No debe aparecer el nombre original
  assert.ok(!xml.includes('Matriculacion Alumno Secundaria'),
    'No debe aparecer el FName original')
  assert.ok(!xml.includes('MatriculacionAlumnoSecundaria'),
    'No debe aparecer el FormID original')

  console.log('✅ Test 6 pasado\n')
}

// Ejecutar todos los tests
try {
  test1()
  test2()
  test3()
  test4()
  test5()
  test6()

  console.log('✅ Todos los tests pasaron correctamente')
  process.exit(0)
} catch (err) {
  console.error('❌ Test falló:', err.message)
  console.error(err.stack)
  process.exit(1)
}
