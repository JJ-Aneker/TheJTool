(function () {
  async function renderTherefore() {
    const html = `
      <section class="panel resultados iframe-container" id="mainPanel" style="padding: 0;">
        <iframe
          src="therefore_builder.html"
          class="iframe-embed"
          title="Therefore Category Builder"
          allowfullscreen
          style="min-height: calc(100vh - 120px);">
        </iframe>
      </section>
    `;
    UI.replaceWithAnimation(html);
    UI.updateActionPanel(`
      <button class="action-card" type="button" onclick="window.open('therefore_builder.html','_blank')">
        <span class="icon">🔗</span>
        <span class="action-text">Abrir en ventana nueva</span>
      </button>
      <button class="action-card" type="button" onclick="window.open('therefore_manual.html','_blank')">
        <span class="icon">📖</span>
        <span class="action-text">Manual de uso</span>
      </button>
    `);
  }

  Router.registerView("therefore", renderTherefore);
})();
