(function () {
  async function renderEForms() {
    const html = `
      <section class="panel resultados iframe-container" id="mainPanel" style="padding: 0;">
        <iframe
          src="eforms_builder.html"
          class="iframe-embed"
          title="Therefore eForms Builder"
          allowfullscreen
          style="min-height: calc(100vh - 120px);">
        </iframe>
      </section>
    `;
    UI.replaceWithAnimation(html);
    UI.updateActionPanel(`
      <button class="action-card" type="button" onclick="window.open('eforms_builder.html','_blank')">
        <span class="icon">🔗</span>
        <span class="action-text">Abrir en ventana nueva</span>
      </button>
    `);
  }

  Router.registerView("eforms", renderEForms);
})();
