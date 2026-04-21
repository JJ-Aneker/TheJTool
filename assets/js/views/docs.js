(function () {
  async function renderDocs() {
    const html = `
      <section class="panel resultados" id="mainPanel">
        <div class="page-header">
          <div class="page-header-content">
            <h2>Documentos</h2>
            <p>Gestiona documentos y archivos del sistema.</p>
          </div>
        </div>
        <p class="intro-text">Módulo en preparación.</p>
      </section>
    `;
    UI.replaceWithAnimation(html);
  }

  Router.registerView("docs", renderDocs);
})();