// ===============================
// views/home.js – Home (bienvenida)
// ===============================

(function () {
  async function renderHome() {
    const userName = window.__profile?.name || "Usuario";
    const userRole = window.__profile?.role || "read";

    const roleLabel = {
      read: "Lector",
      write: "Editor",
      admin: "Administrador"
    }[userRole];

    const html = `
      <section class="panel resultados" id="mainPanel" style="overflow-y: auto; max-height: calc(100vh - 180px); padding-right: 0.5rem;">
        <div class="page-header">
          <div class="page-header-content">
            <h2>Bienvenido a TheJToolbox</h2>
            <p>Tu plataforma integral de gestión y administración.</p>
          </div>
        </div>

        <!-- HERO BANNER -->
        <div style="width: 100%; aspect-ratio: 16/9; margin-bottom: 2rem; border-radius: 12px; overflow: hidden; background: linear-gradient(135deg, rgba(40,215,199,0.2) 0%, rgba(88,166,255,0.1) 100%);">
          <img src="assets/images/banner.jpg" alt="Banner" style="width: 100%; height: 100%; object-fit: cover;" />
        </div>

        <!-- INTRO TEXT -->
        <p style="color: rgba(238,244,255,.8); font-size: 1rem; line-height: 1.8; margin-bottom: 2rem;">
          TheJToolbox es una plataforma moderna y potente diseñada para optimizar tu flujo de trabajo.
          Desde la gestión de documentos hasta la administración de usuarios, todo en un solo lugar.
        </p>

        <!-- FEATURES GRID -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; margin-bottom: 2.5rem;">

          <!-- Card 1 -->
          <div style="background: rgba(20,30,50,0.4); border: 1px solid rgba(40,215,199,.2); border-radius: 10px; padding: 1.8rem; transition: all 0.3s;">
            <div style="font-size: 2.2rem; margin-bottom: 1rem;">📂</div>
            <h3 style="color: rgba(238,244,255,.95); font-size: 1.05rem; margin-bottom: 0.5rem; font-weight: 600;">Gestión de Documentos</h3>
            <p style="color: rgba(238,244,255,.65); font-size: 0.95rem; line-height: 1.6;">
              Accede y organiza todos tus documentos de forma segura. Búsqueda rápida, categorización inteligente y acceso instantáneo.
            </p>
          </div>

          <!-- Card 2 -->
          <div style="background: rgba(20,30,50,0.4); border: 1px solid rgba(40,215,199,.2); border-radius: 10px; padding: 1.8rem; transition: all 0.3s;">
            <div style="font-size: 2.2rem; margin-bottom: 1rem;">⚙️</div>
            <h3 style="color: rgba(238,244,255,.95); font-size: 1.05rem; margin-bottom: 0.5rem; font-weight: 600;">Therefore™ Integration</h3>
            <p style="color: rgba(238,244,255,.65); font-size: 0.95rem; line-height: 1.6;">
              Herramientas especializadas para gestión de categorías y formularios electrónicos. Diseño avanzado de flujos de trabajo.
            </p>
          </div>

          <!-- Card 3 -->
          <div style="background: rgba(20,30,50,0.4); border: 1px solid rgba(40,215,199,.2); border-radius: 10px; padding: 1.8rem; transition: all 0.3s;">
            <div style="font-size: 2.2rem; margin-bottom: 1rem;">👥</div>
            <h3 style="color: rgba(238,244,255,.95); font-size: 1.05rem; margin-bottom: 0.5rem; font-weight: 600;">Admin Control</h3>
            <p style="color: rgba(238,244,255,.65); font-size: 0.95rem; line-height: 1.6;">
              Panel de administración para gestionar usuarios, permisos y roles. Control total sobre tu instancia.
            </p>
          </div>

          <!-- Card 4 -->
          <div style="background: rgba(20,30,50,0.4); border: 1px solid rgba(40,215,199,.2); border-radius: 10px; padding: 1.8rem; transition: all 0.3s;">
            <div style="font-size: 2.2rem; margin-bottom: 1rem;">🔍</div>
            <h3 style="color: rgba(238,244,255,.95); font-size: 1.05rem; margin-bottom: 0.5rem; font-weight: 600;">Búsqueda Avanzada</h3>
            <p style="color: rgba(238,244,255,.65); font-size: 0.95rem; line-height: 1.6;">
              Encuentra lo que necesitas al instante con búsqueda contextual y filtros inteligentes.
            </p>
          </div>

          <!-- Card 5 -->
          <div style="background: rgba(20,30,50,0.4); border: 1px solid rgba(40,215,199,.2); border-radius: 10px; padding: 1.8rem; transition: all 0.3s;">
            <div style="font-size: 2.2rem; margin-bottom: 1rem;">📊</div>
            <h3 style="color: rgba(238,244,255,.95); font-size: 1.05rem; margin-bottom: 0.5rem; font-weight: 600;">Procesamiento IA</h3>
            <p style="color: rgba(238,244,255,.65); font-size: 0.95rem; line-height: 1.6;">
              Procesa documentos con inteligencia artificial. Extracción de datos automática y análisis inteligente.
            </p>
          </div>

          <!-- Card 6 -->
          <div style="background: rgba(20,30,50,0.4); border: 1px solid rgba(40,215,199,.2); border-radius: 10px; padding: 1.8rem; transition: all 0.3s;">
            <div style="font-size: 2.2rem; margin-bottom: 1rem;">🚀</div>
            <h3 style="color: rgba(238,244,255,.95); font-size: 1.05rem; margin-bottom: 0.5rem; font-weight: 600;">Cloud-Ready</h3>
            <p style="color: rgba(238,244,255,.65); font-size: 0.95rem; line-height: 1.6;">
              Accede desde cualquier lugar. Sincronización en tiempo real y backups automáticos.
            </p>
          </div>
        </div>

        <!-- GETTING STARTED -->
        <div style="background: rgba(40,215,199,0.05); border: 1px solid rgba(40,215,199,.15); border-radius: 10px; padding: 2rem; margin-top: 2rem;">
          <h3 style="color: rgba(238,244,255,.95); margin-bottom: 1rem;">🚀 Próximos Pasos</h3>
          <ul style="color: rgba(238,244,255,.7); list-style: none; padding: 0;">
            <li style="margin-bottom: 0.8rem;">✓ Completa tu perfil en la sección <strong>Datos de usuario</strong></li>
            <li style="margin-bottom: 0.8rem;">✓ Explora las herramientas en el menú lateral</li>
            <li style="margin-bottom: 0.8rem;">✓ Sube o gestiona tus documentos</li>
            ${window.__profile?.role === "admin" ? '<li style="margin-bottom: 0.8rem;">✓ Administra usuarios en el panel de <strong>Administración</strong></li>' : ''}
          </ul>
        </div>
      </section>
    `;

    UI.replaceWithAnimation(html);
    UI.updateActionPanel("");
  }

  Router.registerView("home", renderHome);
})();
