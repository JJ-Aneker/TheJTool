# Configuración de Emails Personalizados en Supabase

## 📧 Plantillas de Email a Personalizar

Ve a: **Supabase Dashboard** → **Authentication** → **Email Templates**

---

## 1. Confirm Signup (Confirmación de Registro)

**Cuándo se envía:** Cuando un usuario se registra en TheJTool

**Subject sugerido:**
```
Confirma tu cuenta en TheJTool - Therefore™ Administration Panel
```

**Body sugerido (HTML):**
```html
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
  <div style="background-color: white; padding: 30px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: #1e293b; margin: 0; font-size: 28px;">🚀 TheJToolbox</h1>
      <p style="color: #64748b; font-size: 14px; margin: 5px 0 0 0;">Therefore™ Administration Panel</p>
    </div>

    <!-- Main Content -->
    <div style="background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%); padding: 20px; border-radius: 8px; margin-bottom: 25px;">
      <h2 style="color: #0f172a; margin: 0 0 15px 0; font-size: 22px;">¡Bienvenido a TheJTool!</h2>
      <p style="color: #475569; margin: 0; line-height: 1.6;">
        Hemos recibido tu solicitud de registro. Para activar tu cuenta, confirma tu dirección de email haciendo click en el botón de abajo.
      </p>
    </div>

    <!-- CTA Button -->
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{ .ConfirmationURL }}" 
         style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);">
        ✓ Confirmar mi Email
      </a>
    </div>

    <!-- Info Box -->
    <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 25px 0;">
      <p style="color: #92400e; margin: 0; font-size: 13px; line-height: 1.5;">
        <strong>⏳ Pendiente de aprobación</strong><br>
        Después de confirmar tu email, un administrador debe aprobar tu cuenta antes de que puedas acceder a TheJTool. Te notificaremos cuando tu cuenta sea aprobada.
      </p>
    </div>

    <!-- Footer -->
    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center;">
      <p style="color: #94a3b8; font-size: 12px; margin: 0 0 10px 0;">
        Si no solicitaste esta cuenta, puedes ignorar este email.
      </p>
      <p style="color: #cbd5e1; font-size: 11px; margin: 0;">
        TheJTool - Therefore™ Administration Panel<br>
        © 2026 - Powered by Supabase
      </p>
    </div>

  </div>
</div>
```

**IMPORTANTE:** Asegúrate de usar la variable `{{ .ConfirmationURL }}` para el enlace de confirmación.

---

## 2. Magic Link (Opcional)

Si usas login sin contraseña (magic link):

**Subject:**
```
Tu enlace de acceso a TheJTool
```

**Body:**
```html
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #1e293b;">🔐 Acceso a TheJTool</h1>
  <p>Haz click en el botón para acceder:</p>
  <a href="{{ .ConfirmationURL }}" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
    Acceder a TheJTool
  </a>
  <p style="color: #64748b; font-size: 13px;">Este enlace expira en 1 hora.</p>
</div>
```

---

## 3. Reset Password (Restablecer Contraseña)

**Subject:**
```
Restablece tu contraseña de TheJTool
```

**Body:**
```html
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #1e293b;">🔑 Restablecer Contraseña</h1>
  <p>Recibimos una solicitud para restablecer tu contraseña en TheJTool.</p>
  <a href="{{ .ConfirmationURL }}" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
    Restablecer Contraseña
  </a>
  <p style="color: #64748b; font-size: 13px;">Si no solicitaste este cambio, ignora este email.</p>
</div>
```

---

## 4. Invite User (Invitar Usuario - Opcional)

Si permites que los admins inviten usuarios directamente:

**Subject:**
```
Has sido invitado a TheJTool
```

**Body:**
```html
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #1e293b;">🎉 Invitación a TheJTool</h1>
  <p>Has sido invitado a unirte a TheJTool - Therefore™ Administration Panel.</p>
  <a href="{{ .ConfirmationURL }}" style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
    Aceptar Invitación
  </a>
  <p style="color: #64748b; font-size: 13px;">Tu cuenta ya está aprobada y lista para usar.</p>
</div>
```

---

## 📨 Email SMTP Settings

En **Supabase Dashboard** → **Settings** → **Auth** → **SMTP Settings**

### Opción 1: Usar SMTP de Supabase (Default)
- Ya está configurado
- Tiene límites de envío
- Suficiente para desarrollo/testing

### Opción 2: Usar Gmail SMTP (Recomendado para producción)
```
Host: smtp.gmail.com
Port: 587
Username: tu-email@gmail.com
Password: [App Password - NO tu contraseña normal]
Sender Email: noreply@thejtool.com (o tu-email@gmail.com)
Sender Name: TheJTool - Therefore™
```

**Para crear App Password en Gmail:**
1. Ve a https://myaccount.google.com/security
2. Activa "Verificación en 2 pasos"
3. Ve a "Contraseñas de aplicaciones"
4. Genera una para "Correo"
5. Copia el password de 16 caracteres

### Opción 3: Usar SendGrid, AWS SES, etc.
Consulta la documentación de Supabase para otros proveedores.

---

## ✅ Verificación

Después de configurar:

1. **Prueba el flujo completo:**
   - Registra un nuevo usuario desde TheJTool
   - Verifica que llega el email personalizado
   - Haz click en el enlace de confirmación
   - Ve a UserManager y verifica el estado

2. **Comprueba los estados:**
   - Email Confirmado: ✓
   - Aprobado: ✗ (debe estar pendiente)
   - Click en "✓ Aprobar" desde UserManager
   - Usuario ya puede hacer login

---

## 🔧 Troubleshooting

**No llegan los emails:**
- Revisa la configuración SMTP
- Verifica que el email sender esté verificado
- Mira los logs en Supabase Dashboard → Logs

**Email va a spam:**
- Configura SPF, DKIM y DMARC en tu dominio
- Usa un servicio profesional (SendGrid, AWS SES)

**Error al confirmar:**
- Verifica que `{{ .ConfirmationURL }}` esté en el template
- Comprueba que el enlace no haya expirado (24h por defecto)

