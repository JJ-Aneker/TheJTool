(function () {
  async function renderDocs() {
    const html = `
      <section class="panel resultados" id="mainPanel">
        <h2>Documentos</h2>
        <p style="color: rgba(238,244,255,.6); font-size: 0.9rem; margin-top: 0.75rem;">Gestiona documentos y archivos del sistema.</p>
        <div style="background: #1F1F1F; padding: 1rem; border-radius: 6px; margin-top: 0.75rem; text-align: center; color: rgba(238,244,255,.5);">
          Módulo en preparación.
        </div>
      </section>
    `;
    UI.replaceWithAnimation(html);
  }

  Router.registerView("docs", renderDocs);
})();