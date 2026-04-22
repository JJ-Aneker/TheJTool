(function () {
  async function renderCategoryReplicator() {
    const html = `
      <section class="panel resultados" id="mainPanel" style="display: flex; flex-direction: column;">
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 1rem; margin-bottom: 1rem;">
          <div style="flex-shrink: 0;">
            <h2 style="margin: 0 0 0.2rem 0;">Therefore™ Category Replicator</h2>
            <p style="margin: 0; font-size: 0.8rem; color: rgba(238,244,255,.5);">Clona y replica categorías de documentos rápidamente</p>
          </div>
          <div style="display: flex; gap: 0.5rem; flex-shrink: 0;">
            <button class="action-btn" type="button" onclick="window.open('category_replicator.html','_blank')">
              <span class="icon">🔗</span>
              <span class="action-text">Abrir</span>
            </button>
          </div>
        </div>
        <div class="iframe-container" style="flex: 1; overflow: hidden; background: #1F1F1F; border-radius: 6px;">
          <iframe
            src="category_replicator.html"
            class="iframe-embed"
            title="Therefore Category Replicator"
            allowfullscreen
            style="min-height: calc(100vh - 200px);">
          </iframe>
        </div>
      </section>
    `;
    UI.replaceWithAnimation(html);
  }

  Router.registerView("categoryReplicator", renderCategoryReplicator);
})();
