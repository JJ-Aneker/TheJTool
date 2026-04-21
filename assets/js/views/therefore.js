(function () {
  async function renderTherefore() {
    const html = `
      <section class="panel resultados" id="mainPanel" style="display: flex; flex-direction: column;">
        <div style="display: flex; justify-content: flex-end; align-items: center; padding: 1rem 1.5rem 0; gap: 0.6rem;">
          <button class="action-card" type="button" onclick="window.open('therefore_builder.html','_blank')">
            <span class="icon">🔗</span>
            <span class="action-text">Abrir en ventana nueva</span>
          </button>
          <button class="action-card" type="button" onclick="window.open('therefore_manual.html','_blank')">
            <span class="icon">📖</span>
            <span class="action-text">Manual de uso</span>
          </button>
        </div>
        <div class="iframe-container" style="flex: 1; overflow: hidden; padding: 1rem;">
          <iframe
            src="therefore_builder.html"
            class="iframe-embed"
            title="Therefore Category Builder"
            allowfullscreen
            style="min-height: calc(100vh - 200px);">
          </iframe>
        </div>
      </section>
    `;
    UI.replaceWithAnimation(html);
  }

  Router.registerView("therefore", renderTherefore);
})();
