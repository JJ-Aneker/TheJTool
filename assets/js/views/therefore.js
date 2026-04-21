(function () {
  async function renderTherefore() {
    const html = `
      <section class="panel resultados" id="mainPanel" style="display: flex; flex-direction: column;">
        <div style="display: flex; justify-content: flex-end; gap: 0.5rem; margin-bottom: 0.75rem;">
          <button class="action-btn" type="button" onclick="window.open('therefore_builder.html','_blank')">
            <span class="icon">🔗</span>
            <span class="action-text">Abrir</span>
          </button>
          <button class="action-btn" type="button" onclick="window.open('therefore_manual.html','_blank')">
            <span class="icon">📖</span>
            <span class="action-text">Manual</span>
          </button>
        </div>
        <div class="iframe-container" style="flex: 1; overflow: hidden; background: #1F1F1F; border-radius: 6px;">
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
