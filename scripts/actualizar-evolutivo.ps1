# Actualizar vertical "evolutivo" con información completa

$body = @{
    herramientas_recomendadas = @(
        'Therefore™ Solution Designer',
        'Therefore™ Workflow Designer',
        'SQL Server Management Studio',
        'Therefore™ Web Access',
        'Postman (testing API)',
        'Git (control de versiones)',
        'Visual Studio Code'
    )
    ejemplo_workflows = @(
        @{
            nombre = 'WF Solicitud de Cambio'
            descripcion = 'Flujo de aprobación de change requests'
            tipo = 'automatico'
            etapas = @('Recepción CR', 'Análisis técnico', 'Aprobación manager', 'Desarrollo', 'Testing UAT', 'Despliegue')
        },
        @{
            nombre = 'WF Escalado por Vencimiento'
            descripcion = 'Escalado automático si no hay respuesta en plazo'
            tipo = 'automatico'
            etapas = @('Inicio', 'Espera respuesta (5 días)', 'Escalado a superior', 'Espera respuesta (3 días)', 'Escalado a dirección')
        }
    )
    integraciones_comunes = @(
        'API REST de Therefore™ para consultas externas',
        'Webhooks para notificaciones en tiempo real',
        'Integración con Active Directory (usuarios)',
        'Export/Import masivo mediante XML',
        'Reportes custom mediante SQL queries'
    )
    procesos_clave = @(
        'Análisis de impacto sobre configuración existente',
        'Backup completo antes de cambios',
        'Testing en categorías de prueba',
        'Migración de datos si aplica',
        'Documentación de cambios realizados',
        'UAT con usuarios clave'
    )
    integraciones_usuario = @(
        'Portal web personalizado para seguimiento de CRs',
        'Notificaciones por email automáticas',
        'Dashboard de métricas en tiempo real'
    )
} | ConvertTo-Json -Depth 10

Write-Host "📝 Actualizando vertical: evolutivo"
$response = Invoke-RestMethod -Uri 'http://localhost:3002/api/verticales' -Method Get
$evolutivo = $response | Where-Object { $_.nombre -eq 'evolutivo' }

if ($evolutivo) {
    $updateUrl = "http://localhost:3002/api/verticales/$($evolutivo.id)"
    Invoke-RestMethod -Uri $updateUrl -Method PATCH -Body $body -ContentType 'application/json'
    Write-Host "✅ Evolutivo actualizado"
} else {
    Write-Host "❌ No encontrado"
}
