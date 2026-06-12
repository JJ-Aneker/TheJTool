// Seed dashboard with sample data for testing
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

async function seedDashboardData() {
  console.log('🌱 Seeding dashboard data...\n')

  try {
    // Get current user ID (you'll need to replace this with actual user ID)
    const { data: { users } } = await supabase.auth.admin.listUsers()
    const userId = users[0]?.id
    const userName = users[0]?.email?.split('@')[0] || 'Usuario'

    if (!userId) {
      console.error('❌ No users found. Please create a user first.')
      return
    }

    console.log(`👤 Using user: ${userName} (${userId})\n`)

    // 1. Seed generated documents
    console.log('📄 Seeding generated documents...')
    const documents = [
      {
        user_id: userId,
        document_type: 'EFDT',
        title: 'EFDT - Proyecto NotifApp',
        pages: 45,
        status: 'completed',
        generated_at: new Date(Date.now() - 5 * 60 * 1000).toISOString() // 5 min ago
      },
      {
        user_id: userId,
        document_type: 'Budget',
        title: 'Budget - Integración SAGE',
        pages: 12,
        status: 'completed',
        generated_at: new Date(Date.now() - 60 * 60 * 1000).toISOString() // 1h ago
      },
      {
        user_id: userId,
        document_type: 'Requirements',
        title: 'Requirements - Portal Empleado',
        pages: 28,
        status: 'completed',
        generated_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString() // 3h ago
      },
      {
        user_id: userId,
        document_type: 'CR',
        title: 'Change Request - v2.1',
        pages: 8,
        status: 'completed',
        generated_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // 1 day ago
      }
    ]

    const { data: docsInserted, error: docsError } = await supabase
      .from('generated_documents')
      .insert(documents)

    if (docsError) {
      console.error('   ❌ Error:', docsError.message)
    } else {
      console.log(`   ✅ Inserted ${documents.length} documents\n`)
    }

    // 2. Seed report executions
    console.log('📊 Seeding report executions...')
    const reports = [
      {
        user_id: userId,
        tenant_name: 'BuildingCenter',
        report_name: 'Facturas Q1 2026',
        category_no: 1,
        category_name: 'Facturas',
        condition: 'Fecha >= 2026-01-01',
        result_count: 245,
        status: 'success',
        execution_time_ms: 1234,
        executed_at: new Date(Date.now() - 2 * 60 * 1000).toISOString() // 2 min ago
      },
      {
        user_id: userId,
        tenant_name: 'Legal',
        report_name: 'Contratos Activos',
        category_no: 2,
        category_name: 'Contratos',
        condition: 'Estado = Activo',
        result_count: 89,
        status: 'success',
        execution_time_ms: 876,
        executed_at: new Date(Date.now() - 15 * 60 * 1000).toISOString() // 15 min ago
      },
      {
        user_id: userId,
        tenant_name: 'HR Department',
        report_name: 'Expedientes HR',
        category_no: 3,
        category_name: 'Empleados',
        condition: '',
        result_count: 312,
        status: 'success',
        execution_time_ms: 2100,
        executed_at: new Date(Date.now() - 60 * 60 * 1000).toISOString() // 1h ago
      },
      {
        user_id: userId,
        tenant_name: 'Compras',
        report_name: 'Albaranes Pendientes',
        category_no: 4,
        category_name: 'Albaranes',
        condition: 'Estado = Pendiente',
        result_count: 45,
        status: 'success',
        execution_time_ms: 650,
        executed_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2h ago
      }
    ]

    const { data: reportsInserted, error: reportsError } = await supabase
      .from('report_executions')
      .insert(reports)

    if (reportsError) {
      console.error('   ❌ Error:', reportsError.message)
    } else {
      console.log(`   ✅ Inserted ${reports.length} report executions\n`)
    }

    // 3. Seed activity log
    console.log('⚡ Seeding activity log...')
    const activities = [
      {
        user_id: userId,
        user_name: userName,
        action_type: 'report_executed',
        action_description: 'ejecutó report "Facturas Q1 2026"',
        entity_type: 'report',
        entity_id: 'facturas-q1',
        created_at: new Date(Date.now() - 2 * 60 * 1000).toISOString()
      },
      {
        user_id: userId,
        user_name: 'María López',
        action_type: 'eform_created',
        action_description: 'creó nuevo eForm "Solicitud Vacaciones"',
        entity_type: 'eform',
        entity_id: 'eform-123',
        created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString()
      },
      {
        user_id: userId,
        user_name: 'Sistema',
        action_type: 'document_generated',
        action_description: 'generó documento EFDT automáticamente',
        entity_type: 'document',
        entity_id: 'doc-456',
        created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString()
      },
      {
        user_id: userId,
        user_name: 'Admin',
        action_type: 'category_created',
        action_description: 'creó categoría "Contratos Legales"',
        entity_type: 'category',
        entity_id: 'cat-789',
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      }
    ]

    const { data: activityInserted, error: activityError } = await supabase
      .from('activity_log')
      .insert(activities)

    if (activityError) {
      console.error('   ❌ Error:', activityError.message)
    } else {
      console.log(`   ✅ Inserted ${activities.length} activity events\n`)
    }

    console.log('✅ Dashboard seeding completed!\n')
    console.log('🎯 Next steps:')
    console.log('   1. Open http://localhost:5173')
    console.log('   2. Navigate to Home page')
    console.log('   3. You should see real data now!')

  } catch (error) {
    console.error('❌ Seeding failed:', error)
  }
}

seedDashboardData()
