(function () {
  async function renderCategoryReplicator() {
    const html = `
      <section class="panel resultados iframe-container" id="mainPanel" style="padding: 0;">
        <iframe
          src="category_replicator.html"
          class="iframe-embed"
          title="Therefore Category Replicator"
          allowfullscreen
          style="min-height: calc(100vh - 120px);">
        </iframe>
      </section>
    `;
    UI.replaceWithAnimation(html);
    UI.updateActionPanel(`
      <button class="action-card" type="button" onclick="window.open('category_replicator.html','_blank')">
        <span class="icon">🔗</span>
        <span class="action-text">Abrir en ventana nueva</span>
      </button>
    `);
  }

  Router.registerView("categoryReplicator", renderCategoryReplicator);
})();
