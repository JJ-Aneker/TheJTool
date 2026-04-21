(function () {
  async function renderSearch() {
    const html = `
      <section class="panel resultados" id="mainPanel">
        <div class="page-header">
          <div class="page-header-content">
            <h2>Búsqueda</h2>
            <p>Busca documentos y registros en el sistema.</p>
          </div>
        </div>
        <p class="intro-text">Módulo en preparación.</p>
      </section>
    `;
    UI.replaceWithAnimation(html);
  }

  Router.registerView("search", renderSearch);
})();