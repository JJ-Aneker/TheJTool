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
      <section class="panel resultados" id="mainPanel" style="overflow-y: auto; overflow-x: hidden; height: 100%;">

        <!-- HERO BANNER (full width) -->
        <div style="width: 100%; height: 160px; margin: 0 0 1.5rem 0; border-radius: 6px; overflow: hidden; background: linear-gradient(135deg, rgba(0, 72, 148, 0.3) 0%, rgba(0, 72, 148, 0.1) 100%);">
          <img src="assets/images/banner.jpg" alt="Banner" style="width: 100%; height: 100%; object-fit: cover;" />
        </div>

        <!-- PAGE HEADER -->
        <div>
          <h2 style="margin: 0 0 0.5rem 0; color: #004894;">Bienvenido a TheJToolbox</h2>
          <p style="margin: 0 0 1.5rem 0; color: rgba(238,244,255,.7); font-size: 0.95rem;">
            Tu plataforma integral de gestión y administración.
          </p>

          <!-- FEATURES GRID - COMPACT -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 0.75rem;">

            <!-- Card 1 -->
            <div style="background: #1F1F1F; border: 1px solid rgba(0, 72, 148, 0.3); border-radius: 6px; padding: 1rem; transition: all 0.3s;">
              <div style="font-size: 1.6rem; margin-bottom: 0.5rem;">📂</div>
              <h3 style="color: #004894; font-size: 0.9rem; margin: 0 0 0.3rem 0; font-weight: 600;">Gestión de Documentos</h3>
              <p style="color: rgba(238,244,255,.65); font-size: 0.8rem; line-height: 1.4; margin: 0;">
                Accede y organiza documentos de forma segura.
              </p>
            </div>

            <!-- Card 2 -->
            <div style="background: #1F1F1F; border: 1px solid rgba(0, 72, 148, 0.3); border-radius: 6px; padding: 1rem; transition: all 0.3s;">
              <div style="font-size: 1.6rem; margin-bottom: 0.5rem;">⚙️</div>
              <h3 style="color: #004894; font-size: 0.9rem; margin: 0 0 0.3rem 0; font-weight: 600;">Therefore™ Integration</h3>
              <p style="color: rgba(238,244,255,.65); font-size: 0.8rem; line-height: 1.4; margin: 0;">
                Gestión de categorías y formularios electrónicos.
              </p>
            </div>

            <!-- Card 3 -->
            <div style="background: #1F1F1F; border: 1px solid rgba(0, 72, 148, 0.3); border-radius: 6px; padding: 1rem; transition: all 0.3s;">
              <div style="font-size: 1.6rem; margin-bottom: 0.5rem;">👥</div>
              <h3 style="color: #004894; font-size: 0.9rem; margin: 0 0 0.3rem 0; font-weight: 600;">Admin Control</h3>
              <p style="color: rgba(238,244,255,.65); font-size: 0.8rem; line-height: 1.4; margin: 0;">
                Panel de administración para gestionar usuarios.
              </p>
            </div>

            <!-- Card 4 -->
            <div style="background: #1F1F1F; border: 1px solid rgba(0, 72, 148, 0.3); border-radius: 6px; padding: 1rem; transition: all 0.3s;">
              <div style="font-size: 1.6rem; margin-bottom: 0.5rem;">🔍</div>
              <h3 style="color: #004894; font-size: 0.9rem; margin: 0 0 0.3rem 0; font-weight: 600;">Búsqueda Avanzada</h3>
              <p style="color: rgba(238,244,255,.65); font-size: 0.8rem; line-height: 1.4; margin: 0;">
                Encuentra información al instante con filtros inteligentes.
              </p>
            </div>

            <!-- Card 5 -->
            <div style="background: #1F1F1F; border: 1px solid rgba(0, 72, 148, 0.3); border-radius: 6px; padding: 1rem; transition: all 0.3s;">
              <div style="font-size: 1.6rem; margin-bottom: 0.5rem;">📊</div>
              <h3 style="color: #004894; font-size: 0.9rem; margin: 0 0 0.3rem 0; font-weight: 600;">Procesamiento IA</h3>
              <p style="color: rgba(238,244,255,.65); font-size: 0.8rem; line-height: 1.4; margin: 0;">
                Procesa documentos con inteligencia artificial.
              </p>
            </div>

            <!-- Card 6 -->
            <div style="background: #1F1F1F; border: 1px solid rgba(0, 72, 148, 0.3); border-radius: 6px; padding: 1rem; transition: all 0.3s;">
              <div style="font-size: 1.6rem; margin-bottom: 0.5rem;">🚀</div>
              <h3 style="color: #004894; font-size: 0.9rem; margin: 0 0 0.3rem 0; font-weight: 600;">Cloud-Ready</h3>
              <p style="color: rgba(238,244,255,.65); font-size: 0.8rem; line-height: 1.4; margin: 0;">
                Accede desde cualquier lugar, sincronización en tiempo real.
              </p>
            </div>

          </div>
        </div>

      </section>
    `;

    UI.replaceWithAnimation(html);
  }

  Router.registerView("home", renderHome);
})();
