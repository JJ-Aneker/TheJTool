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
        <div style="width: 100%; height: 180px; margin: 0 0 2rem 0; border-radius: 0; overflow: hidden; background: linear-gradient(135deg, rgba(40,215,199,0.2) 0%, rgba(88,166,255,0.1) 100%);">
          <img src="assets/images/banner.jpg" alt="Banner" style="width: 100%; height: 100%; object-fit: cover;" />
        </div>

        <!-- PAGE HEADER -->
        <div style="padding: 0 1.5rem;">
          <h2 style="margin: 0 0 0.5rem 0; color: rgba(238,244,255,.95);">Bienvenido a TheJToolbox</h2>
          <p style="margin: 0 0 2rem 0; color: rgba(238,244,255,.7); font-size: 0.95rem;">
            Tu plataforma integral de gestión y administración.
          </p>

          <!-- FEATURES GRID - COMPACT -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; margin-bottom: 2rem;">

            <!-- Card 1 -->
            <div style="background: rgba(20,30,50,0.4); border: 1px solid rgba(40,215,199,.2); border-radius: 10px; padding: 1.2rem; transition: all 0.3s;">
              <div style="font-size: 1.8rem; margin-bottom: 0.75rem;">📂</div>
              <h3 style="color: rgba(238,244,255,.95); font-size: 0.95rem; margin: 0 0 0.4rem 0; font-weight: 600;">Gestión de Documentos</h3>
              <p style="color: rgba(238,244,255,.65); font-size: 0.85rem; line-height: 1.5; margin: 0;">
                Accede y organiza documentos de forma segura.
              </p>
            </div>

            <!-- Card 2 -->
            <div style="background: rgba(20,30,50,0.4); border: 1px solid rgba(40,215,199,.2); border-radius: 10px; padding: 1.2rem; transition: all 0.3s;">
              <div style="font-size: 1.8rem; margin-bottom: 0.75rem;">⚙️</div>
              <h3 style="color: rgba(238,244,255,.95); font-size: 0.95rem; margin: 0 0 0.4rem 0; font-weight: 600;">Therefore™ Integration</h3>
              <p style="color: rgba(238,244,255,.65); font-size: 0.85rem; line-height: 1.5; margin: 0;">
                Gestión de categorías y formularios electrónicos.
              </p>
            </div>

            <!-- Card 3 -->
            <div style="background: rgba(20,30,50,0.4); border: 1px solid rgba(40,215,199,.2); border-radius: 10px; padding: 1.2rem; transition: all 0.3s;">
              <div style="font-size: 1.8rem; margin-bottom: 0.75rem;">👥</div>
              <h3 style="color: rgba(238,244,255,.95); font-size: 0.95rem; margin: 0 0 0.4rem 0; font-weight: 600;">Admin Control</h3>
              <p style="color: rgba(238,244,255,.65); font-size: 0.85rem; line-height: 1.5; margin: 0;">
                Panel de administración para gestionar usuarios.
              </p>
            </div>

            <!-- Card 4 -->
            <div style="background: rgba(20,30,50,0.4); border: 1px solid rgba(40,215,199,.2); border-radius: 10px; padding: 1.2rem; transition: all 0.3s;">
              <div style="font-size: 1.8rem; margin-bottom: 0.75rem;">🔍</div>
              <h3 style="color: rgba(238,244,255,.95); font-size: 0.95rem; margin: 0 0 0.4rem 0; font-weight: 600;">Búsqueda Avanzada</h3>
              <p style="color: rgba(238,244,255,.65); font-size: 0.85rem; line-height: 1.5; margin: 0;">
                Encuentra información al instante con filtros inteligentes.
              </p>
            </div>

            <!-- Card 5 -->
            <div style="background: rgba(20,30,50,0.4); border: 1px solid rgba(40,215,199,.2); border-radius: 10px; padding: 1.2rem; transition: all 0.3s;">
              <div style="font-size: 1.8rem; margin-bottom: 0.75rem;">📊</div>
              <h3 style="color: rgba(238,244,255,.95); font-size: 0.95rem; margin: 0 0 0.4rem 0; font-weight: 600;">Procesamiento IA</h3>
              <p style="color: rgba(238,244,255,.65); font-size: 0.85rem; line-height: 1.5; margin: 0;">
                Procesa documentos con inteligencia artificial.
              </p>
            </div>

            <!-- Card 6 -->
            <div style="background: rgba(20,30,50,0.4); border: 1px solid rgba(40,215,199,.2); border-radius: 10px; padding: 1.2rem; transition: all 0.3s;">
              <div style="font-size: 1.8rem; margin-bottom: 0.75rem;">🚀</div>
              <h3 style="color: rgba(238,244,255,.95); font-size: 0.95rem; margin: 0 0 0.4rem 0; font-weight: 600;">Cloud-Ready</h3>
              <p style="color: rgba(238,244,255,.65); font-size: 0.85rem; line-height: 1.5; margin: 0;">
                Accede desde cualquier lugar, sincronización en tiempo real.
              </p>
            </div>

          </div>
        </div>

      </section>
    `;

    UI.replaceWithAnimation(html);
    UI.updateActionPanel("");
  }

  Router.registerView("home", renderHome);
})();
