// ===============================
// views/home.js – Home (bienvenida)
// ===============================

(function () {
  async function renderHome() {

    const html = `
      <section class="panel resultados" id="mainPanel">
        <div class="page-header">
          <div class="page-header-content">
            <h2>Bienvenido a Aneker</h2>
            <p>Tu punto de acceso a herramientas y módulos de gestión.</p>
          </div>
        </div>

        <p class="intro-text">
          Desde el menú lateral puedes navegar entre funcionalidades y el panel derecho te mostrará acciones según el contexto.
        </p>

        <div class="card-grid">
          <div class="content-card">
            <h3>Siguiente paso</h3>
            <p>
              Elige un módulo en el menú: <strong>Buscar</strong>, <strong>Documentos</strong>, <strong>Usuario</strong> o <strong>Therefore Dynamic View</strong>.
            </p>
          </div>

          <div class="content-card">
            <h3>Consejo rápido</h3>
            <p>
              Puedes colapsar/expandir el menú y el panel de acciones con el botón ⇆.
              El portal recuerda tu preferencia automáticamente.
            </p>
          </div>
        </div>
      </section>
    `;

    UI.replaceWithAnimation(html);
    UI.updateActionPanel(`
      <button class="action-card" id="home-go-user" type="button">
        <span class="icon">👤</span>
        <span class="action-text">Ir a mi perfil</span>
      </button>

      <button class="action-card" id="home-go-ws" type="button">
        <span class="icon">🧭</span>
        <span class="action-text">Abrir Therefore Dynamic View</span>
      </button>
    `);

    setTimeout(() => {
      document.getElementById("home-go-user")?.addEventListener("click", () => Router.setView("user"));
      document.getElementById("home-go-ws")?.addEventListener("click", () => Router.setView("ws"));
    }, 0);
  }

  Router.registerView("home", renderHome);
})();