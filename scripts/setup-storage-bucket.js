// Script para crear y configurar el bucket de Supabase Storage
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Cargar .env
dotenv.config({ path: join(__dirname, '..', '.env') })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: VITE_SUPABASE_URL y SUPABASE_SERVICE_KEY requeridos en .env')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function setupBucket() {
  console.log('🚀 Configurando bucket de Supabase Storage...\n')

  try {
    // 1. Verificar si el bucket ya existe
    console.log('1️⃣ Verificando bucket existente...')
    const { data: buckets } = await supabase.storage.listBuckets()
    const bucketExists = buckets?.some(b => b.name === 'document-uploads')

    if (bucketExists) {
      console.log('✅ Bucket "document-uploads" ya existe\n')
    } else {
      // 2. Crear bucket
      console.log('2️⃣ Creando bucket "document-uploads"...')
      const { data: newBucket, error: createError } = await supabase.storage.createBucket('document-uploads', {
        public: true,
        fileSizeLimit: 52428800, // 50 MB
        allowedMimeTypes: null // Permitir todos
      })

      if (createError) {
        throw new Error(`Error creando bucket: ${createError.message}`)
      }

      console.log('✅ Bucket creado exitosamente\n')
    }

    // 3. Configurar políticas RLS
    console.log('3️⃣ Configurando políticas de seguridad...')

    // Política 1: Upload (usuarios pueden subir a su carpeta)
    const policyUpload = `
      CREATE POLICY IF NOT EXISTS "Users can upload their own documents"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK (
        bucket_id = 'document-uploads'
        AND auth.uid()::text = (storage.foldername(name))[1]
      );
    `

    // Política 2: Read (todos pueden leer)
    const policyRead = `
      CREATE POLICY IF NOT EXISTS "Anyone can read documents"
      ON storage.objects FOR SELECT
      TO public
      USING (bucket_id = 'document-uploads');
    `

    // Política 3: Delete (usuarios pueden borrar sus propios archivos)
    const policyDelete = `
      CREATE POLICY IF NOT EXISTS "Users can delete their own documents"
      ON storage.objects FOR DELETE
      TO authenticated
      USING (
        bucket_id = 'document-uploads'
        AND auth.uid()::text = (storage.foldername(name))[1]
      );
    `

    // Ejecutar políticas
    const { error: errorUpload } = await supabase.rpc('exec_sql', { sql: policyUpload })
    if (errorUpload && !errorUpload.message.includes('already exists')) {
      console.warn('⚠️ Error política upload:', errorUpload.message)
    } else {
      console.log('  ✓ Política upload configurada')
    }

    const { error: errorRead } = await supabase.rpc('exec_sql', { sql: policyRead })
    if (errorRead && !errorRead.message.includes('already exists')) {
      console.warn('⚠️ Error política read:', errorRead.message)
    } else {
      console.log('  ✓ Política read configurada')
    }

    const { error: errorDelete } = await supabase.rpc('exec_sql', { sql: policyDelete })
    if (errorDelete && !errorDelete.message.includes('already exists')) {
      console.warn('⚠️ Error política delete:', errorDelete.message)
    } else {
      console.log('  ✓ Política delete configurada')
    }

    console.log('\n✅ Configuración completada exitosamente!\n')
    console.log('📦 Bucket: document-uploads')
    console.log('🔒 Políticas: upload, read, delete configuradas')
    console.log('🌐 Acceso: público para lectura, privado para escritura/borrado\n')

  } catch (error) {
    console.error('❌ Error durante la configuración:', error.message)
    console.error('\n⚠️ NOTA: Si las políticas fallan, crea el bucket manualmente en:')
    console.error('   https://supabase.com/dashboard → Storage → New Bucket')
    console.error('   Nombre: document-uploads')
    console.error('   Public: YES\n')
    process.exit(1)
  }
}

// Ejecutar
setupBucket()
